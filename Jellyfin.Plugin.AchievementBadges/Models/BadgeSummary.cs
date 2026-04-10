namespace Jellyfin.Plugin.AchievementBadges.Models;

public class BadgeSummary
{
    public int Unlocked { get; set; }

    public int Total { get; set; }

    public double Percentage { get; set; }

    public int EquippedCount { get; set; }

    public int Score { get; set; }

    public int CurrentWatchStreak { get; set; }

    public int BestWatchStreak { get; set; }
}