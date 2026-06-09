namespace Jellyfin.Plugin.AchievementBadges.Models;

/// <summary>
/// [v2.1.0 "Open Library"] Records how a badge unlock was earned so
/// admin tooling (especially the M6 "Audit + clean wrongly-awarded
/// daily badges" workflow) can distinguish genuine realtime earnings
/// from backfill artefacts and surface only the suspicious ones for
/// human review.
///
/// Defaults to <see cref="Initial"/> so pre-v2.1.0 unlocks in existing
/// user-profile JSON files deserialize cleanly — they represent the
/// pre-v2.1.0 state where the source wasn't tracked. New unlocks from
/// v2.1.0 onwards always carry an explicit source.
/// </summary>
public enum EarnSource
{
    /// <summary>Persisted before v2.1.0 introduced source tracking.
    /// Treated as opaque history; never auto-cleaned by audit tools.</summary>
    Initial = 0,

    /// <summary>Awarded during the lifetime-cumulative
    /// WatchHistoryBackfillService scan. Time-windowed badges should
    /// never carry this source under v2.1.0 (skipped during scan); if
    /// they do it indicates pre-v2.1.0 data and is a candidate for
    /// audit-cleanup review.</summary>
    Backfill = 1,

    /// <summary>Awarded by a live playback / event during normal
    /// operation. The trusted source — never auto-cleaned.</summary>
    RealTime = 2,

    /// <summary>Awarded by the M6 "Recompute time-windowed badges"
    /// admin tool, which walks history with proper day/week/month
    /// bucketing. Carries a historical UnlockedAt timestamp matching
    /// when the bucket condition was actually met.</summary>
    Recompute = 3,

    /// <summary>Admin-granted via the testing tools surface (was
    /// "manualGrant" in v2.0). Never auto-cleaned.</summary>
    Manual = 4,
}
