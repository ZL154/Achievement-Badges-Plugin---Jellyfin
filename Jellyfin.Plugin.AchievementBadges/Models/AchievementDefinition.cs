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
}