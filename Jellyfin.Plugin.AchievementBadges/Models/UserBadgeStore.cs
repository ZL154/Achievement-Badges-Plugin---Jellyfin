using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Models;

public class UserBadgeStore
{
    public Dictionary<string, UserAchievementProfile> UserProfiles { get; set; } = new();
}
