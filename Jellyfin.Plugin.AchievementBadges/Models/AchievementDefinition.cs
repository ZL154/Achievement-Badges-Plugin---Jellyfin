namespace Jellyfin.Plugin.AchievementBadges.Models;

public class AchievementDefinition
{
    public string Id { get; set; } = string.Empty;

    public string Key { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Icon { get; set; } = "emoji_events";

    public string Category { get; set; } = "General";

    public string Rarity { get; set; } = "Common";

    public int TargetValue { get; set; }

    public AchievementMetric Metric { get; set; }

    public bool IsSecret { get; set; }

    public string? MetricParameter { get; set; }

    public bool IsCustom { get; set; }

    public bool IsChallenge { get; set; }

    public System.DateTimeOffset? ChallengeStart { get; set; }

    public System.DateTimeOffset? ChallengeEnd { get; set; }

    /// <summary>[v2.1.0 "Open Library"] Which media type the badge tracks.
    /// Used to route playback events to the right counter pipeline + to
    /// group badges in the user-facing UI. Defaults to <see cref="MediaType.Film"/>
    /// so v2.0.x built-in definitions keep their existing classification
    /// without per-row migration. M2 (Music) and M3 (Book) tracks emit
    /// definitions with Music / Book / Anime explicitly.</summary>
    public MediaType Media { get; set; } = MediaType.Film;

    /// <summary>[v2.1.0 "Open Library"] Marks the badge as evaluated
    /// against a bounded time window (daily / weekly / monthly).
    /// <c>null</c> means lifetime-cumulative (v2.0.x behaviour). Used by
    /// <c>WatchHistoryBackfillService</c> to skip time-windowed badges
    /// during the initial scan (which can't correctly award them — see
    /// issue #27) and by the M6 recompute tool to know which badges to
    /// re-evaluate with proper day-bucketing.</summary>
    public BadgeTimeWindow? TimeWindow { get; set; }
}