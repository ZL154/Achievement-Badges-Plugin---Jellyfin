using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Jellyfin.Plugin.AchievementBadges.Models;

public class UserAchievementProfile
{
    public string UserId { get; set; } = string.Empty;
    public UserAchievementCounters Counters { get; set; } = new();
    public List<AchievementBadge> Badges { get; set; } = new();
    public List<string> EquippedBadgeIds { get; set; } = new();

    public int PrestigeLevel { get; set; }
    public int ScoreBank { get; set; }
    public int LifetimeScore { get; set; }

    public DateTimeOffset? LastPlaybackAt { get; set; }
    public int ComboCount { get; set; }
    public int BestComboCount { get; set; }

    public List<string> BoughtBadgeIds { get; set; } = new();

    public string? DailyQuestId { get; set; }
    public string? DailyQuestDate { get; set; }
    public bool DailyQuestCompleted { get; set; }
    public int DailyQuestStartValue { get; set; }

    public string? WeeklyQuestId { get; set; }
    public string? WeeklyQuestWeek { get; set; }
    public bool WeeklyQuestCompleted { get; set; }
    public int WeeklyQuestStartValue { get; set; }

    public List<QuestState> DailyQuests { get; set; } = new();
    public List<QuestState> WeeklyQuests { get; set; } = new();

    public List<string> PinnedBadgeIds { get; set; } = new();

    public string? EquippedTitleBadgeId { get; set; }

    public List<int> CompletionMilestonesReached { get; set; } = new();

    public List<CompareHistoryEntry> CompareHistory { get; set; } = new();

    public UserNotificationPreferences Preferences { get; set; } = new();
}

public class CompareHistoryEntry
{
    public string OtherUserId { get; set; } = string.Empty;
    public string OtherUserName { get; set; } = string.Empty;
    public DateTimeOffset At { get; set; }
}

public class UserNotificationPreferences
{
    // Existing toast controls
    [JsonPropertyName("EnableUnlockToasts")]
    public bool EnableUnlockToasts { get; set; } = true;

    [JsonPropertyName("EnableMilestoneToasts")]
    public bool EnableMilestoneToasts { get; set; } = true;

    [JsonPropertyName("EnableConfetti")]
    public bool EnableConfetti { get; set; } = true;

    [JsonPropertyName("AppearInActivityFeed")]
    public bool AppearInActivityFeed { get; set; } = true;

    [JsonPropertyName("EnableCoWatchBonus")]
    public bool EnableCoWatchBonus { get; set; } = true;

    // Toast controls
    [JsonPropertyName("EnableSound")]
    public bool EnableSound { get; set; } = true;

    [JsonPropertyName("MinimumToastRarity")]
    public string MinimumToastRarity { get; set; } = "all"; // "all", "rare", "epic", "legendary"

    // Privacy
    [JsonPropertyName("HideFromLeaderboard")]
    public bool HideFromLeaderboard { get; set; } = false;

    [JsonPropertyName("HideFromCompare")]
    public bool HideFromCompare { get; set; } = false;

    [JsonPropertyName("HideFromPrestigeBoard")]
    public bool HideFromPrestigeBoard { get; set; } = false;

    // Display
    [JsonPropertyName("AchievementPageTheme")]
    public string AchievementPageTheme { get; set; } = "default"; // "default", "dark", "light"

    [JsonPropertyName("SpoilerMode")]
    public bool SpoilerMode { get; set; } = false;

    [JsonPropertyName("ExtremeSpoilerMode")]
    public bool ExtremeSpoilerMode { get; set; } = false;

    [JsonPropertyName("EquippedBadgeSlots")]
    public int EquippedBadgeSlots { get; set; } = 5; // 1-10

    [JsonPropertyName("AutoEquipNewUnlocks")]
    public bool AutoEquipNewUnlocks { get; set; } = true;

    [JsonPropertyName("EnablePushNotifications")]
    public bool EnablePushNotifications { get; set; } = false;

    // UI language preference. "default" means use the admin-configured
    // DefaultLanguage; otherwise one of "en", "fr", "es".
    [JsonPropertyName("Language")]
    public string Language { get; set; } = "default";
}

public class QuestState
{
    public string Id { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public int StartValue { get; set; }
}
