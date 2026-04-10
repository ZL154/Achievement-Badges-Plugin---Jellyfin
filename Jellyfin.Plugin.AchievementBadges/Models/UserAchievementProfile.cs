using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Models;

public class UserAchievementProfile
{
    public string UserId { get; set; } = string.Empty;
    public UserAchievementCounters Counters { get; set; } = new();
    public List<AchievementBadge> Badges { get; set; } = new();
    public List<string> EquippedBadgeIds { get; set; } = new();
}
