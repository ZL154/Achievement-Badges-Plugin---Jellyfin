namespace Jellyfin.Plugin.AchievementBadges.Models;

public class LeaderboardEntry
{
    public string UserId { get; set; } = string.Empty;

    public int Unlocked { get; set; }

    public int Total { get; set; }

    public double Percentage { get; set; }

    public int Score { get; set; }

    public int BestWatchStreak { get; set; }
}