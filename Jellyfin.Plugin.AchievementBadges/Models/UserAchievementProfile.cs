using System;
using System.Collections.Generic;

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
}

public class QuestState
{
    public string Id { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public int StartValue { get; set; }
}
