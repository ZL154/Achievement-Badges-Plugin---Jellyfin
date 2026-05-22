using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Models;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// v2.0 — Power-up system. Pure player-state mutations; no I/O of its
/// own (the host service is responsible for persisting the profile after
/// a mutation). Intentionally kept thin so AchievementBadgeService can
/// call into it without worrying about cross-service locking or save
/// fan-out.
/// </summary>
public class PowerUpService
{
    private readonly ILogger<PowerUpService> _logger;

    public PowerUpService(ILogger<PowerUpService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Add a power-up to a user's inventory. No-op if the per-type cap is
    /// already reached (so a runaway grant loop can't blow up the JSON).
    /// </summary>
    public bool Grant(UserAchievementProfile profile, PowerUpType type, int amount = 1)
    {
        if (profile is null) return false;
        if (amount <= 0) return false;
        var key = type.ToString();
        profile.PowerUpInventory.TryGetValue(key, out var current);
        var cap = type == PowerUpType.StreakFreeze
            ? PowerUpDefinitions.MaxStreakFreezesBanked
            : PowerUpDefinitions.MaxInventoryPerType;
        if (current >= cap)
        {
            return false;
        }
        var next = Math.Min(cap, current + amount);
        profile.PowerUpInventory[key] = next;
        // Streak Freeze auto-banks into the dedicated counter field so the
        // streak calculator can consume it without re-reading the dict.
        if (type == PowerUpType.StreakFreeze)
        {
            profile.StreakFreezesBanked = Math.Min(
                PowerUpDefinitions.MaxStreakFreezesBanked,
                profile.StreakFreezesBanked + (next - current));
        }
        return true;
    }

    /// <summary>
    /// Activate a power-up. Returns (success, message) — failures are
    /// non-throwing because the controller path needs to surface human
    /// errors to the UI without HTTP 500s.
    /// </summary>
    public (bool ok, string message) Use(UserAchievementProfile profile, PowerUpType type, DateTimeOffset now)
    {
        if (profile is null) return (false, "Profile not found.");
        var key = type.ToString();
        profile.PowerUpInventory.TryGetValue(key, out var have);
        if (have <= 0)
        {
            return (false, $"You don't have any {PowerUpDefinitions.GetDisplayName(type)} to use.");
        }

        switch (type)
        {
            case PowerUpType.XpBoost:
                profile.ActiveXpBoostUntil = now.AddMinutes(PowerUpDefinitions.XpBoostDurationMinutes);
                break;
            case PowerUpType.DoubleCredit:
                if (profile.DoubleCreditPending)
                {
                    return (false, "You already have a Double Credit primed. Watch something first.");
                }
                profile.DoubleCreditPending = true;
                break;
            case PowerUpType.StreakFreeze:
                // Streak Freeze is auto-consumed by the streak calculator,
                // not by manual Use. Forbid manual activation so users can't
                // burn a freeze on a day they didn't need it.
                return (false, "Streak Freeze is consumed automatically when a day is missed. No manual use needed.");
        }

        profile.PowerUpInventory[key] = have - 1;
        return (true, $"{PowerUpDefinitions.GetDisplayName(type)} activated.");
    }

    /// <summary>
    /// Returns true if an XP-boost window is currently active. Caller
    /// applies <see cref="PowerUpDefinitions.XpBoostMultiplier"/> to the
    /// score grant when true.
    /// </summary>
    public bool IsXpBoostActive(UserAchievementProfile profile, DateTimeOffset now)
    {
        if (profile?.ActiveXpBoostUntil is null) return false;
        return profile.ActiveXpBoostUntil > now;
    }

    /// <summary>
    /// If a Double Credit is pending, consume it and return the credit
    /// multiplier for THIS item. Otherwise returns 1. Called once per
    /// successful credit in <see cref="AchievementBadgeService.RecordPlayback"/>.
    /// </summary>
    public int ConsumeDoubleCreditIfPending(UserAchievementProfile profile)
    {
        if (profile?.DoubleCreditPending == true)
        {
            profile.DoubleCreditPending = false;
            return PowerUpDefinitions.DoubleCreditMultiplier;
        }
        return 1;
    }

    /// <summary>
    /// Try to consume a banked Streak Freeze. Returns true if consumed
    /// (streak should be treated as continued); false if none available.
    /// </summary>
    public bool TryConsumeStreakFreeze(UserAchievementProfile profile)
    {
        if (profile is null) return false;
        if (profile.StreakFreezesBanked <= 0) return false;
        profile.StreakFreezesBanked--;
        var key = PowerUpType.StreakFreeze.ToString();
        if (profile.PowerUpInventory.TryGetValue(key, out var have) && have > 0)
        {
            profile.PowerUpInventory[key] = have - 1;
        }
        return true;
    }

    /// <summary>
    /// Shape inventory for the API response. Returns a list rather than
    /// the raw dict so the wire format is stable across enum additions.
    /// </summary>
    public List<object> GetInventoryView(UserAchievementProfile profile, DateTimeOffset now)
    {
        var view = new List<object>();
        if (profile is null) return view;
        foreach (var type in Enum.GetValues<PowerUpType>())
        {
            var key = type.ToString();
            profile.PowerUpInventory.TryGetValue(key, out var count);
            var active = type switch
            {
                PowerUpType.XpBoost => IsXpBoostActive(profile, now),
                PowerUpType.DoubleCredit => profile.DoubleCreditPending,
                PowerUpType.StreakFreeze => profile.StreakFreezesBanked > 0,
                _ => false
            };
            view.Add(new
            {
                Type = key,
                DisplayName = PowerUpDefinitions.GetDisplayName(type),
                Description = PowerUpDefinitions.GetDescription(type),
                Icon = PowerUpDefinitions.GetIcon(type),
                Count = count,
                Active = active,
                ActiveUntil = type == PowerUpType.XpBoost ? profile.ActiveXpBoostUntil : null
            });
        }
        return view;
    }
}
