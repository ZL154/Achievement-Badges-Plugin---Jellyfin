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

    // ---- v2.0: Power-ups + Shop + Cosmetics ------------------------------

    /// <summary>
    /// Power-up inventory keyed by PowerUpType.ToString() ("XpBoost",
    /// "DoubleCredit", "StreakFreeze"). Capped per-type by
    /// PowerUpDefinitions.MaxInventoryPerType so admins can't inadvertently
    /// brick a profile with overflow.
    /// </summary>
    public Dictionary<string, int> PowerUpInventory { get; set; } = new();

    /// <summary>
    /// Active XP-boost expiry. null = no active boost. Refresh-not-stack:
    /// applying a second boost while active just resets the timer to the
    /// new 60-minute window. Reading is O(1) on every score-grant call.
    /// </summary>
    public DateTimeOffset? ActiveXpBoostUntil { get; set; }

    /// <summary>
    /// True when the user has activated a Double Credit power-up; cleared
    /// to false after the next item credits through the integrity gate.
    /// </summary>
    public bool DoubleCreditPending { get; set; }

    /// <summary>
    /// Streak Freezes currently banked (max PowerUpDefinitions.MaxStreak
    /// FreezesBanked). Auto-consumed by the streak calculator when a
    /// missed day would otherwise break the watch streak.
    /// </summary>
    public int StreakFreezesBanked { get; set; }

    /// <summary>
    /// Cosmetic ids the user has purchased or auto-unlocked via score
    /// milestone. Lookup-only — equipped state lives in the three
    /// EquippedXxxId fields below so a user can preview switches without
    /// re-buying.
    /// </summary>
    public List<string> OwnedCosmetics { get; set; } = new();

    /// <summary>Currently-equipped profile theme cosmetic id, null = default.</summary>
    public string? EquippedThemeId { get; set; }

    /// <summary>Currently-equipped badge frame cosmetic id, null = default.</summary>
    public string? EquippedBadgeFrameId { get; set; }

    /// <summary>Currently-equipped custom rank title cosmetic id, null = auto tier name.</summary>
    public string? EquippedCustomTitleId { get; set; }

    /// <summary>
    /// v2.0: equipped Avatar cosmetic id (e.g. "avatar-trophy"). Replaces the
    /// default medal emoji next to the rank label.
    /// </summary>
    public string? EquippedAvatarId { get; set; }

    /// <summary>
    /// v2.0.x: equipped Background cosmetic id (e.g. "bg-blackhole"). Adds an
    /// animated CSS layer behind the page content.
    /// </summary>
    public string? EquippedBackgroundId { get; set; }

    /// <summary>
    /// v2.0.x: equipped Profile Border cosmetic id (e.g. "border-plasma").
    /// Wraps the achievement-profile hero card with an animated edge.
    /// </summary>
    public string? EquippedProfileBorderId { get; set; }

    /// <summary>Running total of score spent in shop. Useful for "lifetime value" achievements and admin audits.</summary>
    public int LifetimeScoreSpent { get; set; }

    /// <summary>
    /// UTC date key ("yyyy-MM-dd") of the last Daily Login Bonus claim.
    /// Bonus triggers on the first &gt;=80% real watch of a UTC day; this
    /// prevents double-claiming on a single day.
    /// </summary>
    public string? LastLoginBonusDate { get; set; }

    /// <summary>
    /// Daily-quest reroll bookkeeping. Resets at UTC midnight. Default
    /// allowance is 1 reroll per UTC day so users can swap an unappealing
    /// quest without grinding it or skipping it.
    /// </summary>
    public int DailyQuestRerollsUsed { get; set; }
    public string? DailyQuestRerollDate { get; set; }

    /// <summary>
    /// Weekly-quest reroll bookkeeping. Resets every Monday UTC. Default
    /// allowance is 1 reroll per ISO week so users can swap a long-haul
    /// weekly that doesn't fit their viewing pattern.
    /// </summary>
    public int WeeklyQuestRerollsUsed { get; set; }
    public string? WeeklyQuestRerollWeek { get; set; }

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

    /// <summary>
    /// "grouped" collapses a burst into one summary animation; "individual"
    /// preserves the legacy one-animation-per-badge queue.
    /// </summary>
    [JsonPropertyName("UnlockToastGrouping")]
    public string UnlockToastGrouping { get; set; } = "grouped";

    /// <summary>
    /// Where unlock toasts appear on this user's own screen: "top-right"
    /// (default, since #74 moved them off the subtitle line), "top-left",
    /// "bottom-right", "bottom-left", or "bottom-center" (the original
    /// placement). Purely presentational and per-user.
    /// </summary>
    [JsonPropertyName("ToastPosition")]
    public string ToastPosition { get; set; } = "top-right";

    /// <summary>
    /// "all-devices" preserves cross-client delivery. "originating-device"
    /// delivers only when the polling client matches the device that earned
    /// the unlock; originless unlocks intentionally do not toast in that mode.
    /// </summary>
    [JsonPropertyName("UnlockToastDeviceScope")]
    public string UnlockToastDeviceScope { get; set; } = "all-devices";

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

    // v1.8.56: hide the offline "last watched" line in the friends drawer.
    // Distinct from HideNowPlaying (which only hides the live online watch
    // status) — this controls the offline-state echo introduced in v1.8.54.
    [JsonPropertyName("HideLastWatched")]
    public bool HideLastWatched { get; set; } = false;

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

    // [#42/#45 follow-up] Which shareable profile-card skin this user's public
    // card renders as: "" or "console" (default clean card), "metro" or
    // "blades" (the retro Xbox 360 dashboards). Read by the anonymous
    // profile-card endpoint when no explicit ?style= is given, so a user's
    // shared card looks the way they chose.
    [JsonPropertyName("ProfileCardStyle")]
    public string ProfileCardStyle { get; set; } = "";

    // Navigation integrations are intentionally independent. The admin-level
    // plugin configuration remains the ceiling, while each user can hide only
    // the optional surface they do not want without disabling achievements.
    [JsonPropertyName("ShowCustomTabsEntry")]
    public bool ShowCustomTabsEntry { get; set; } = true;

    [JsonPropertyName("ShowPluginPagesEntry")]
    public bool ShowPluginPagesEntry { get; set; } = true;

    [JsonPropertyName("ShowUserMenuShortcut")]
    public bool ShowUserMenuShortcut { get; set; } = true;

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
    public bool MuteToastsDuringPlayback { get; set; } = false;

    /// <summary>
    /// One-time migration marker for the old accidental default where visual
    /// unlock toasts were muted during playback for every profile.
    /// </summary>
    [JsonPropertyName("ToastPlaybackMuteDefaultMigrated")]
    public bool? ToastPlaybackMuteDefaultMigrated { get; set; }

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
