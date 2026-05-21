using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Models;

public class UserPlaybackState
{
    public string UserId { get; set; } = string.Empty;

    public Dictionary<string, DateTimeOffset> RecentlyCompletedItemIds { get; set; } = new();

    public int TotalCompletedItems { get; set; }

    public int TotalCompletedMovies { get; set; }

    public int TotalCompletedEpisodes { get; set; }

    public DateTimeOffset? LastCompletionAt { get; set; }

    // v1.9.8 — per-day credit count, keyed by UTC date "yyyy-MM-dd". Used by
    // the daily watch-rate cap to bound how many items can be credited to
    // badges per 24h. Entries older than 30 days are pruned on write.
    public Dictionary<string, int> CreditedItemsByDate { get; set; } = new();

    // v1.9.8 — rolling 1-hour list of credit timestamps for the suspicious-
    // activity rate flag. Capped at 256 entries; older entries beyond 1h are
    // pruned on each credit attempt.
    public List<DateTimeOffset> RecentCreditTimestamps { get; set; } = new();

    // v1.9.8 — last time a suspicious-rate audit-log entry fired for this
    // user. Used to throttle the flag to once per hour so a single bad
    // burst doesn't spam the audit log.
    public DateTimeOffset? LastSuspiciousFlagAt { get; set; }
}
