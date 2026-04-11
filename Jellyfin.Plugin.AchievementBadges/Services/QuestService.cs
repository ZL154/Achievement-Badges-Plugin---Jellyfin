using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Models;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class QuestService
{
    private readonly AchievementBadgeService _badgeService;

    public record QuestTemplate(string Id, string Title, string Description, AchievementMetric Metric, int Target, int Reward, string Icon);

    public const int DailyQuestCount = 3;
    public const int WeeklyQuestCount = 3;

    public static readonly IReadOnlyList<QuestTemplate> DailyTemplates = new List<QuestTemplate>
    {
        new("daily-watch-any",        "Daily Watch",         "Watch any item today.",                     AchievementMetric.TotalItemsWatched, 1, 20, "play_circle"),
        new("daily-movie",            "Movie Night",         "Watch 1 movie today.",                      AchievementMetric.MoviesWatched,     1, 30, "movie"),
        new("daily-ep-spree",         "Episode Spree",       "Watch 3 episodes today.",                   AchievementMetric.MaxEpisodesInSingleDay, 3, 40, "live_tv"),
        new("daily-lib-hop",          "Library Hop",         "Watch from 2 different libraries today.",   AchievementMetric.UniqueLibrariesVisited, 2, 30, "collections_bookmark"),
        new("daily-late-night",       "Night Watch",         "Catch a late-night session.",               AchievementMetric.LateNightSessions, 1, 25, "dark_mode"),
        new("daily-early-bird",       "Early Start",         "Catch an early-morning session.",           AchievementMetric.EarlyMorningSessions, 1, 25, "wb_sunny"),
        new("daily-genre",            "Genre Explorer",      "Watch from a new genre today.",             AchievementMetric.UniqueGenresWatched, 1, 20, "category"),
        new("daily-rewatch",          "Comfort Watch",       "Rewatch one of your favourites.",           AchievementMetric.RewatchCount, 1, 20, "replay"),
        new("daily-double",           "Double Feature",      "Watch 2 movies today.",                     AchievementMetric.MaxMoviesInSingleDay, 2, 50, "local_movies"),
        new("daily-binge-lite",       "Light Binger",        "Watch 5 items today.",                      AchievementMetric.TotalItemsWatched, 5, 60, "bolt"),
        new("daily-runtime",          "Long Haul",           "Watch an item over 2 hours long.",          AchievementMetric.LongestItemMinutes, 120, 40, "timer"),
        new("daily-short",            "Bite-Size",           "Watch an item under 30 minutes.",           AchievementMetric.ShortItemsWatched, 1, 15, "speed")
    };

    public static readonly IReadOnlyList<QuestTemplate> WeeklyTemplates = new List<QuestTemplate>
    {
        new("weekly-5-movies",        "Cinephile",           "Watch 5 movies this week.",                 AchievementMetric.MoviesWatched,     5, 150, "theaters"),
        new("weekly-20-episodes",     "Series Sprinter",     "Watch 20 episodes this week.",              AchievementMetric.TotalItemsWatched, 20, 200, "tv"),
        new("weekly-streak",          "Daily Dedication",    "Maintain a 5-day watch streak.",            AchievementMetric.CurrentWatchStreak, 5, 180, "timeline"),
        new("weekly-10-hours",        "Marathon Week",       "Watch 10 hours of content this week.",      AchievementMetric.TotalMinutesWatched, 600, 200, "hourglass_top"),
        new("weekly-3-genres",        "Genre Week",          "Watch from 3 different genres this week.",  AchievementMetric.UniqueGenresWatched, 3, 120, "swap_horiz"),
        new("weekly-finish-series",   "Finisher",            "Finish a series this week.",                AchievementMetric.SeriesCompleted,   1, 250, "check_circle"),
        new("weekly-late-3",          "Creature of the Night", "Have 3 late-night sessions this week.",   AchievementMetric.LateNightSessions, 3, 120, "nights_stay"),
        new("weekly-weekend",         "Weekend Binge",       "Have 4 weekend sessions this week.",        AchievementMetric.WeekendSessions,   4, 140, "event_available")
    };

    public QuestService(AchievementBadgeService badgeService)
    {
        _badgeService = badgeService;
    }

    public object GetOrCreate(string userId)
    {
        return new
        {
            Daily = GetOrCreateDailyList(userId),
            Weekly = GetOrCreateWeeklyList(userId)
        };
    }

    public List<object> GetOrCreateDailyList(string userId)
    {
        var profile = _badgeService.PeekProfile(userId);
        if (profile is null) return new List<object>();

        var today = DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd");
        var activeForToday = profile.DailyQuests.Where(q => q.Period == today).ToList();

        if (activeForToday.Count < DailyQuestCount)
        {
            // Drop stale quests from other days and re-pick for today
            profile.DailyQuests.RemoveAll(q => q.Period != today);

            var picked = PickN(DailyTemplates, DailyQuestCount, today.GetHashCode());
            foreach (var tpl in picked)
            {
                if (profile.DailyQuests.Any(q => q.Id == tpl.Id && q.Period == today)) continue;
                profile.DailyQuests.Add(new QuestState
                {
                    Id = tpl.Id,
                    Period = today,
                    Completed = false,
                    StartValue = GetCounterValue(profile.Counters, tpl.Metric)
                });
            }
            _badgeService.SaveProfileDirect(profile);
        }

        return EvaluateQuestList(profile, profile.DailyQuests.Where(q => q.Period == today).ToList(), DailyTemplates, "daily");
    }

    public List<object> GetOrCreateWeeklyList(string userId)
    {
        var profile = _badgeService.PeekProfile(userId);
        if (profile is null) return new List<object>();

        var now = DateTime.Today;
        var isoWeek = ISOWeek.GetWeekOfYear(now);
        var isoYear = ISOWeek.GetYear(now);
        var weekKey = isoYear + "-W" + isoWeek.ToString("D2");

        var activeForWeek = profile.WeeklyQuests.Where(q => q.Period == weekKey).ToList();

        if (activeForWeek.Count < WeeklyQuestCount)
        {
            profile.WeeklyQuests.RemoveAll(q => q.Period != weekKey);

            var picked = PickN(WeeklyTemplates, WeeklyQuestCount, weekKey.GetHashCode());
            foreach (var tpl in picked)
            {
                if (profile.WeeklyQuests.Any(q => q.Id == tpl.Id && q.Period == weekKey)) continue;
                profile.WeeklyQuests.Add(new QuestState
                {
                    Id = tpl.Id,
                    Period = weekKey,
                    Completed = false,
                    StartValue = GetCounterValue(profile.Counters, tpl.Metric)
                });
            }
            _badgeService.SaveProfileDirect(profile);
        }

        return EvaluateQuestList(profile, profile.WeeklyQuests.Where(q => q.Period == weekKey).ToList(), WeeklyTemplates, "weekly");
    }

    // Kept for backward compat with existing controller endpoints
    public object GetOrCreateDaily(string userId)
    {
        var list = GetOrCreateDailyList(userId);
        return list.Count > 0 ? list[0] : new { };
    }

    public object GetOrCreateWeekly(string userId)
    {
        var list = GetOrCreateWeeklyList(userId);
        return list.Count > 0 ? list[0] : new { };
    }

    private List<object> EvaluateQuestList(UserAchievementProfile profile, List<QuestState> states, IReadOnlyList<QuestTemplate> pool, string kind)
    {
        var result = new List<object>();
        var changed = false;
        foreach (var state in states)
        {
            var tpl = pool.FirstOrDefault(t => t.Id == state.Id);
            if (tpl is null) continue;
            var current = GetCounterValue(profile.Counters, tpl.Metric) - state.StartValue;
            if (current < 0) current = 0;
            var complete = current >= tpl.Target;

            if (complete && !state.Completed)
            {
                state.Completed = true;
                profile.ScoreBank += tpl.Reward;
                changed = true;
            }

            result.Add(new
            {
                Kind = kind,
                tpl.Id,
                tpl.Title,
                tpl.Description,
                tpl.Icon,
                tpl.Reward,
                Target = tpl.Target,
                Current = Math.Min(current, tpl.Target),
                Completed = state.Completed,
                Period = state.Period
            });
        }
        if (changed) { _badgeService.SaveProfileDirect(profile); }
        return result;
    }

    private static List<QuestTemplate> PickN(IReadOnlyList<QuestTemplate> pool, int n, int seed)
    {
        if (n >= pool.Count) return pool.ToList();
        var rng = new Random(seed);
        var indices = Enumerable.Range(0, pool.Count).ToList();
        // Fisher-Yates shuffle
        for (var i = indices.Count - 1; i > 0; i--)
        {
            var j = rng.Next(i + 1);
            (indices[i], indices[j]) = (indices[j], indices[i]);
        }
        return indices.Take(n).Select(i => pool[i]).ToList();
    }

    private static int GetCounterValue(UserAchievementCounters counters, AchievementMetric metric)
    {
        return metric switch
        {
            AchievementMetric.TotalItemsWatched => counters.TotalItemsWatched,
            AchievementMetric.MoviesWatched => counters.MoviesWatched,
            AchievementMetric.MaxEpisodesInSingleDay => counters.MaxEpisodesInSingleDay,
            AchievementMetric.MaxMoviesInSingleDay => counters.MaxMoviesInSingleDay,
            AchievementMetric.UniqueLibrariesVisited => counters.UniqueLibrariesVisited,
            AchievementMetric.LateNightSessions => counters.LateNightSessions,
            AchievementMetric.EarlyMorningSessions => counters.EarlyMorningSessions,
            AchievementMetric.WeekendSessions => counters.WeekendSessions,
            AchievementMetric.UniqueGenresWatched => counters.UniqueGenresWatched,
            AchievementMetric.RewatchCount => counters.RewatchCount,
            AchievementMetric.TotalMinutesWatched => counters.TotalMinutesWatched > int.MaxValue ? int.MaxValue : (int)counters.TotalMinutesWatched,
            AchievementMetric.CurrentWatchStreak => counters.BestWatchStreak,
            AchievementMetric.SeriesCompleted => counters.SeriesCompleted,
            AchievementMetric.LongestItemMinutes => counters.LongestItemMinutes,
            AchievementMetric.ShortItemsWatched => counters.ShortItemsWatched,
            _ => 0
        };
    }
}
