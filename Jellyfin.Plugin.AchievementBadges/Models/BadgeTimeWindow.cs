namespace Jellyfin.Plugin.AchievementBadges.Models;

/// <summary>
/// [v2.1.0 "Open Library"] Marks a badge as evaluated against a bounded
/// time window rather than a lifetime cumulative count. The initial
/// watch-history backfill scan (which iterates total counts) cannot
/// correctly award time-windowed badges, so badges tagged with a
/// non-null window are skipped during the initial scan and earned
/// purely through real-time playback events going forward. A separate
/// admin "Recompute time-windowed badges" tool (M6) properly buckets
/// historical events by day/week/month for retroactive crediting.
///
/// Set on <see cref="AchievementDefinition.TimeWindow"/> as a nullable
/// value — null means the badge is lifetime-cumulative and behaves
/// exactly as it did in v2.0.x.
/// </summary>
public enum BadgeTimeWindow
{
    Daily = 0,
    Weekly = 1,
    Monthly = 2,
}
