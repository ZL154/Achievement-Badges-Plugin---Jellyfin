namespace Jellyfin.Plugin.AchievementBadges.Models;

public class ServerStats
{
    public int TotalUsers { get; set; }

    public int TotalBadgesUnlocked { get; set; }

    public int TotalItemsWatched { get; set; }

    public int TotalMoviesWatched { get; set; }

    public int TotalSeriesCompleted { get; set; }

    public string MostCommonBadge { get; set; } = "None";

    public int TotalAchievementScore { get; set; }
}