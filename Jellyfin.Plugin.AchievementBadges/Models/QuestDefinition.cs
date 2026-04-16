namespace Jellyfin.Plugin.AchievementBadges.Models;

/// <summary>
/// Admin-authored quest template. Stored in plugin configuration and merged
/// with the built-in QuestService template lists at pick time. Kept separate
/// from the immutable QuestService.QuestTemplate record so the config
/// serialiser has a simple POCO to round-trip.
/// </summary>
public class QuestDefinition
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AchievementMetric Metric { get; set; } = AchievementMetric.TotalItemsWatched;
    public int Target { get; set; } = 1;
    public int Reward { get; set; } = 20;
    public string Icon { get; set; } = "play_circle";
}
