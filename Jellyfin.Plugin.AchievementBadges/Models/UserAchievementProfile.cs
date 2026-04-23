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

    // Accepted friends — mutual. Adding someone = request; accepting writes
    // to both users' Friends lists. Removing purges from both sides.
    public List<string> Friends { get; set; } = new();

    // Pending outgoing requests: user ids we've sent a request to.
    public List<string> FriendRequestsSent { get; set; } = new();

    // Pending incoming requests: user ids who want to be our friend.
    public List<string> FriendRequestsReceived { get; set; } = new();

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

    // Friend-visibility prefs: AppearOffline makes the user's Online flag
    // always false in the friends drawer (they can still use everything
    // else). HideNowPlaying keeps Online=true but strips the NowPlaying
    // payload so friends only see "Online" instead of the series/episode.
    [JsonPropertyName("AppearOffline")]
    public bool AppearOffline { get; set; } = false;

    [JsonPropertyName("HideNowPlaying")]
    public bool HideNowPlaying { get; set; } = false;

    // Corner for the global friends button: "bottom-left" (default),
    // "bottom-right", "top-left", "top-right". Anything else → bottom-left.
    [JsonPropertyName("FriendsButtonCorner")]
    public string FriendsButtonCorner { get; set; } = "bottom-left";

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

    // When false, hide the equipped-badge showcase UI (sidebar strip, header
    // badge dots, and the equipped slots section on the achievements page
    // profile card). Default true.
    [JsonPropertyName("ShowEquippedShowcase")]
    public bool ShowEquippedShowcase { get; set; } = true;

    // ---- Messaging preferences (v1.8.1) ----------------------------------

    /// <summary>Show a browser/desktop notification when a message arrives.</summary>
    [JsonPropertyName("MessageNotifications")]
    public bool MessageNotifications { get; set; } = true;

    /// <summary>Play a subtle chime when a message arrives.</summary>
    [JsonPropertyName("MessageNotificationSound")]
    public bool MessageNotificationSound { get; set; } = true;

    /// <summary>Suppress message notifications while actively watching something.</summary>
    [JsonPropertyName("MuteMessageNotificationsDuringPlayback")]
    public bool MuteMessageNotificationsDuringPlayback { get; set; } = false;

    /// <summary>Suppress achievement unlock TOASTS (the popup) while actively watching.</summary>
    [JsonPropertyName("MuteToastsDuringPlayback")]
    public bool MuteToastsDuringPlayback { get; set; } = true;

    /// <summary>Suppress achievement unlock SOUND while actively watching.</summary>
    [JsonPropertyName("MuteToastSoundDuringPlayback")]
    public bool MuteToastSoundDuringPlayback { get; set; } = true;

    /// <summary>User IDs this user has blocked — no messages in either direction.</summary>
    [JsonPropertyName("BlockedUsers")]
    public List<string> BlockedUsers { get; set; } = new();
}

public class QuestState
{
    public string Id { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public int StartValue { get; set; }
}
