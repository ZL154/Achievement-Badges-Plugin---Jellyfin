using System;

namespace Jellyfin.Plugin.AchievementBadges.Models;

public class AchievementBadge
{
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    public string Key { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Icon { get; set; } = "military_tech";

    public string Category { get; set; } = "General";

    public bool Unlocked { get; set; }

    public DateTimeOffset? UnlockedAt { get; set; }

    public int CurrentValue { get; set; }

    public int TargetValue { get; set; }

    public string Rarity { get; set; } = "Common";
}