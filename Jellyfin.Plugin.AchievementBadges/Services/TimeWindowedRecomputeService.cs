using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// [v2.1.0 "Open Library" M6, issue #27] Audit + cleanup for daily/weekly/
/// monthly badges wrongly awarded by the pre-v2.1.0 lifetime-cumulative
/// backfill (jojolll's reproduction). v2.1.0's M1 work prevents NEW
/// false-positives by skipping time-windowed badges during the initial
/// scan; this service helps users who upgraded FROM v2.0.x and have
/// wrongly-awarded badges already on their profiles.
/// </summary>
public class TimeWindowedRecomputeService
{
    private readonly AchievementBadgeService _achievements;
    private readonly IUserManager _userManager;
    private readonly ILogger<TimeWindowedRecomputeService> _logger;

    public TimeWindowedRecomputeService(
        AchievementBadgeService achievements,
        IUserManager userManager,
        ILogger<TimeWindowedRecomputeService> logger)
    {
        _achievements = achievements;
        _userManager = userManager;
        _logger = logger;
    }

    /// <summary>Run an audit pass and return all suspicious unlocks.
    /// Does NOT mutate any state.</summary>
    public AuditCleanupReport Audit()
    {
        var report = new AuditCleanupReport();
        var defByKey = AchievementDefinitions.All
            .ToDictionary(d => d.Id, d => d, StringComparer.OrdinalIgnoreCase);

        foreach (var profile in _achievements.EnumerateAllProfiles())
        {
            var username = ResolveUsername(profile.UserId);
            foreach (var badge in profile.Badges)
            {
                if (!badge.Unlocked) continue;
                if (!defByKey.TryGetValue(badge.Id, out var def)) continue;
                if (def.TimeWindow is null) continue;

                // Pre-v2.1.0 unlocks have EarnSource.Initial (default).
                var suspicious = badge.EarnSource is EarnSource.Initial or EarnSource.Backfill;
                if (!suspicious) continue;

                report.Items.Add(new SuspiciousBadgeUnlock
                {
                    BadgeId = badge.Id,
                    BadgeTitle = badge.Title,
                    UserId = profile.UserId,
                    Username = username,
                    UnlockedAt = badge.UnlockedAt,
                    EarnSource = badge.EarnSource.ToString(),
                    Reason = $"Time-windowed ({def.TimeWindow}) badge from pre-v2.1.0 backfill — likely false-positive.",
                });
            }
        }

        report.SuspiciousCount = report.Items.Count;
        _logger.LogInformation("[AchievementBadges] Audit found {Count} suspicious time-windowed unlocks", report.SuspiciousCount);
        return report;
    }

    /// <summary>Clear specified unlocks. Resets Unlocked=false / UnlockedAt=null
    /// / CurrentValue=0 but keeps the badge entry so it can be re-earned
    /// organically. Returns count actually cleared.</summary>
    public int Cleanup(IEnumerable<(string badgeId, string userId)> targets)
    {
        if (targets is null) return 0;
        var cleared = 0;
        var mutatedUsers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var (badgeId, userId) in targets)
        {
            if (string.IsNullOrEmpty(badgeId) || string.IsNullOrEmpty(userId)) continue;
            var profile = _achievements.EnumerateAllProfiles().FirstOrDefault(p =>
                string.Equals(p.UserId, userId, StringComparison.OrdinalIgnoreCase));
            if (profile is null) continue;

            var badge = profile.Badges.FirstOrDefault(b =>
                b.Id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));
            if (badge is null || !badge.Unlocked) continue;

            badge.Unlocked = false;
            badge.UnlockedAt = null;
            badge.CurrentValue = 0;
            cleared++;
            mutatedUsers.Add(profile.UserId);
        }

        if (cleared > 0)
        {
            _achievements.SaveExternallyChangedProfiles();
            _logger.LogInformation("[AchievementBadges] Cleanup cleared {Count} unlocks across {Users} users",
                cleared, mutatedUsers.Count);
        }
        return cleared;
    }

    private string ResolveUsername(string userId)
    {
        try
        {
            if (Guid.TryParse(userId, out var guid))
            {
                var u = _userManager.GetUserById(guid);
                if (u is not null) return u.Username ?? userId;
            }
        }
        catch
        {
        }
        return userId;
    }
}
