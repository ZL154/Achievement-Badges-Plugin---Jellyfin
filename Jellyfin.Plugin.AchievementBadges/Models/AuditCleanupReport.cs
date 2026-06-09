using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Models;

/// <summary>
/// [v2.1.0 "Open Library" M6, issue #27] Result of the audit pass that
/// identifies badges likely to have been wrongly awarded by the pre-
/// v2.1.0 lifetime-cumulative backfill. The admin reviews the list
/// and POSTs a cleanup request with the badge unlocks to remove.
/// </summary>
public class AuditCleanupReport
{
    public int SuspiciousCount { get; set; }

    public List<SuspiciousBadgeUnlock> Items { get; set; } = new();

    public DateTimeOffset GeneratedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// [v2.1.0 "Open Library" M6] One per badge-unlock instance flagged as
/// suspicious. The badge id + user id pair uniquely identifies the
/// unlock to remove during cleanup.
/// </summary>
public class SuspiciousBadgeUnlock
{
    public string BadgeId { get; set; } = string.Empty;
    public string BadgeTitle { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public DateTimeOffset? UnlockedAt { get; set; }
    public string EarnSource { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
