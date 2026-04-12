using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class AchievementBadgeService
{
    private readonly string _dataFilePath;
    private readonly object _lock = new();
    private readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };
    private readonly ILogger<AchievementBadgeService> _logger;
    private readonly IUserManager _userManager;
    private readonly WebhookNotifier? _webhookNotifier;
    private readonly AuditLogService? _auditLog;

    private Dictionary<string, UserAchievementProfile> _userProfiles = new();

    public AchievementBadgeService(
        IApplicationPaths applicationPaths,
        IUserManager userManager,
        WebhookNotifier webhookNotifier,
        AuditLogService auditLog,
        ILogger<AchievementBadgeService> logger)
    {
        _logger = logger;
        _userManager = userManager;
        _webhookNotifier = webhookNotifier;
        _auditLog = auditLog;

        var pluginDataPath = Path.Combine(applicationPaths.PluginConfigurationsPath, "achievementbadges");
        Directory.CreateDirectory(pluginDataPath);

        _dataFilePath = Path.Combine(pluginDataPath, "badges.json");
        Load();
    }

    public object CompareUsers(string userIdA, string userIdB)
    {
        userIdA = NormalizeUserId(userIdA);
        userIdB = NormalizeUserId(userIdB);
        lock (_lock)
        {
            var pa = _userProfiles.TryGetValue(userIdA, out var profileA) ? profileA : null;
            var pb = _userProfiles.TryGetValue(userIdB, out var profileB) ? profileB : null;
            if (pa is null || pb is null) return new { Error = "One or both users not found." };

            EvaluateBadges(pa, userIdA, silent: true);
            EvaluateBadges(pb, userIdB, silent: true);

            var enabledA = pa.Badges.Where(b => IsBadgeEnabled(b.Id)).ToList();
            var enabledB = pb.Badges.Where(b => IsBadgeEnabled(b.Id)).ToList();

            var unlockedA = enabledA.Count(b => b.Unlocked);
            var unlockedB = enabledB.Count(b => b.Unlocked);
            var scoreA = (int)Math.Round(AchievementScoreHelper.GetTotalUnlockedScore(enabledA) * (1 + 0.5 * pa.PrestigeLevel));
            var scoreB = (int)Math.Round(AchievementScoreHelper.GetTotalUnlockedScore(enabledB) * (1 + 0.5 * pb.PrestigeLevel));

            var unlockedSetA = enabledA.Where(b => b.Unlocked).Select(b => b.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var unlockedSetB = enabledB.Where(b => b.Unlocked).Select(b => b.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);

            return new
            {
                UserA = new
                {
                    UserId = userIdA,
                    UserName = ResolveUserName(userIdA),
                    Score = scoreA,
                    Unlocked = unlockedA,
                    Total = enabledA.Count,
                    PrestigeLevel = pa.PrestigeLevel,
                    pa.Counters.TotalItemsWatched,
                    pa.Counters.MoviesWatched,
                    pa.Counters.SeriesCompleted,
                    pa.Counters.BestWatchStreak,
                    pa.Counters.TotalMinutesWatched,
                    pa.Counters.LateNightSessions,
                    pa.Counters.WeekendSessions,
                    pa.Counters.UniqueGenresWatched,
                    pa.Counters.UniqueLibrariesVisited
                },
                UserB = new
                {
                    UserId = userIdB,
                    UserName = ResolveUserName(userIdB),
                    Score = scoreB,
                    Unlocked = unlockedB,
                    Total = enabledB.Count,
                    PrestigeLevel = pb.PrestigeLevel,
                    pb.Counters.TotalItemsWatched,
                    pb.Counters.MoviesWatched,
                    pb.Counters.SeriesCompleted,
                    pb.Counters.BestWatchStreak,
                    pb.Counters.TotalMinutesWatched,
                    pb.Counters.LateNightSessions,
                    pb.Counters.WeekendSessions,
                    pb.Counters.UniqueGenresWatched,
                    pb.Counters.UniqueLibrariesVisited
                },
                OnlyA = unlockedSetA.Except(unlockedSetB).Count(),
                OnlyB = unlockedSetB.Except(unlockedSetA).Count(),
                Both = unlockedSetA.Intersect(unlockedSetB).Count()
            };
        }
    }

    public object GetActivityFeed(int page = 1, int pageSize = 20, string? filterUserId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;
        var canon = string.IsNullOrWhiteSpace(filterUserId) ? null : NormalizeUserId(filterUserId);

        lock (_lock)
        {
            var entries = new List<(DateTimeOffset At, string UserId, string UserName, AchievementBadge Badge)>();
            foreach (var profile in _userProfiles.Values)
            {
                if (canon != null && !string.Equals(profile.UserId, canon, StringComparison.OrdinalIgnoreCase)) continue;
                // Users who opted out appear only when a specific user filter requests them
                if (canon == null && profile.Preferences != null && !profile.Preferences.AppearInActivityFeed) continue;
                foreach (var b in profile.Badges)
                {
                    if (b.Unlocked && b.UnlockedAt.HasValue && IsBadgeEnabled(b.Id))
                    {
                        entries.Add((b.UnlockedAt.Value, profile.UserId, ResolveUserName(profile.UserId), b));
                    }
                }
            }
            var total = entries.Count;
            var totalPages = (int)Math.Ceiling((double)total / pageSize);
            var skip = (page - 1) * pageSize;
            var pageEntries = entries.OrderByDescending(e => e.At)
                .Skip(skip)
                .Take(pageSize)
                .Select(e => (object)new
                {
                    At = e.At,
                    UserId = e.UserId,
                    UserName = e.UserName,
                    BadgeId = e.Badge.Id,
                    Title = e.Badge.Title,
                    Rarity = e.Badge.Rarity,
                    Icon = e.Badge.Icon,
                    Category = e.Badge.Category
                })
                .ToList();
            return new { Page = page, PageSize = pageSize, TotalPages = totalPages, TotalEntries = total, Entries = pageEntries };
        }
    }

    public object CheckMilestones(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile)) return new { NewlyReached = Array.Empty<int>() };
            var enabled = profile.Badges.Where(b => IsBadgeEnabled(b.Id)).ToList();
            if (enabled.Count == 0) return new { NewlyReached = Array.Empty<int>() };
            var pct = (int)Math.Floor(100.0 * enabled.Count(b => b.Unlocked) / enabled.Count);
            var newlyReached = new List<int>();
            foreach (var milestone in new[] { 25, 50, 75, 100 })
            {
                if (pct >= milestone && !profile.CompletionMilestonesReached.Contains(milestone))
                {
                    profile.CompletionMilestonesReached.Add(milestone);
                    newlyReached.Add(milestone);
                }
            }
            if (newlyReached.Count > 0) Save();
            return new { NewlyReached = newlyReached, CurrentPercent = pct };
        }
    }

    public object GetPersonalRecords(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile)) return new { };
            var c = profile.Counters;
            return new
            {
                TotalItemsWatched = c.TotalItemsWatched,
                MoviesWatched = c.MoviesWatched,
                SeriesCompleted = c.SeriesCompleted,
                BestWatchStreak = c.BestWatchStreak,
                MaxEpisodesInSingleDay = c.MaxEpisodesInSingleDay,
                MaxMoviesInSingleDay = c.MaxMoviesInSingleDay,
                LongestItemMinutes = c.LongestItemMinutes,
                TotalMinutesWatched = c.TotalMinutesWatched,
                TotalHoursWatched = c.TotalMinutesWatched / 60,
                LateNightSessions = c.LateNightSessions,
                EarlyMorningSessions = c.EarlyMorningSessions,
                WeekendSessions = c.WeekendSessions,
                UniqueLibrariesVisited = c.UniqueLibrariesVisited,
                UniqueGenresWatched = c.UniqueGenresWatched,
                UniqueDecadesWatched = c.UniqueDecadesWatched,
                UniqueCountriesWatched = c.UniqueCountriesWatched,
                UniqueLanguagesWatched = c.UniqueLanguagesWatched,
                DaysWatched = c.DaysWatched,
                DaysLoggedIn = c.DaysLoggedIn,
                BestLoginStreak = c.BestLoginStreak,
                ShortItemsWatched = c.ShortItemsWatched,
                LongSeriesCompleted = c.LongSeriesCompleted,
                VeryLongSeriesCompleted = c.VeryLongSeriesCompleted,
                RewatchCount = c.RewatchCount,
                BestComboCount = profile.BestComboCount,
                PrestigeLevel = profile.PrestigeLevel,
                LifetimeScore = profile.LifetimeScore
            };
        }
    }

    public List<object> GetCategoryProgress(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile)) return new List<object>();
            EvaluateBadges(profile, userId, silent: true);
            return profile.Badges
                .Where(b => IsBadgeEnabled(b.Id))
                .GroupBy(b => b.Category ?? "General")
                .Select(g => (object)new
                {
                    Category = g.Key,
                    Total = g.Count(),
                    Unlocked = g.Count(b => b.Unlocked),
                    Percent = g.Count() == 0 ? 0 : (int)Math.Round(100.0 * g.Count(b => b.Unlocked) / g.Count())
                })
                .OrderByDescending(o => (int)o.GetType().GetProperty("Percent")!.GetValue(o)!)
                .ToList();
        }
    }

    public object GetPrestigeLeaderboard(int limit = 10)
    {
        lock (_lock)
        {
            return _userProfiles.Values
                .Where(p => p.PrestigeLevel > 0 || p.LifetimeScore > 0)
                .OrderByDescending(p => p.PrestigeLevel)
                .ThenByDescending(p => p.LifetimeScore)
                .Take(limit)
                .Select(p => (object)new
                {
                    UserId = p.UserId,
                    UserName = ResolveUserName(p.UserId),
                    PrestigeLevel = p.PrestigeLevel,
                    LifetimeScore = p.LifetimeScore,
                    CurrentScore = (int)Math.Round(AchievementScoreHelper.GetTotalUnlockedScore(p.Badges.Where(b => IsBadgeEnabled(b.Id))) * (1 + 0.5 * p.PrestigeLevel))
                })
                .ToList();
        }
    }

    public List<object> GetRecentUnlocks(string userId, int limit = 20)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile)) return new List<object>();
            return profile.Badges
                .Where(b => b.Unlocked && b.UnlockedAt.HasValue && IsBadgeEnabled(b.Id))
                .OrderByDescending(b => b.UnlockedAt)
                .Take(limit)
                .Select(b => (object)new
                {
                    BadgeId = b.Id,
                    b.Title,
                    b.Rarity,
                    b.Icon,
                    b.Category,
                    UnlockedAt = b.UnlockedAt
                })
                .ToList();
        }
    }

    public object GetStreakCalendar(string userId, int weeks = 53)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile))
                return new { Weeks = weeks, Days = Array.Empty<object>(), CurrentStreak = 0, BestStreak = 0, ActiveDays = 0 };

            var watched = new HashSet<DateOnly>();
            foreach (var d in profile.Counters.WatchDates)
            {
                if (DateOnly.TryParse(d, out var parsed)) watched.Add(parsed);
            }

            var today = DateOnly.FromDateTime(DateTime.Today);
            var totalDays = weeks * 7;
            var start = today.AddDays(-(totalDays - 1));

            var days = new List<object>();
            var activeInWindow = 0;
            for (var i = 0; i < totalDays; i++)
            {
                var date = start.AddDays(i);
                var isWatched = watched.Contains(date);
                if (isWatched) activeInWindow++;
                days.Add(new { D = date.ToString("yyyy-MM-dd"), W = isWatched });
            }

            // Current streak: count back from today (or yesterday) until we hit a non-watch day
            var currentStreak = 0;
            var anchor = today;
            // Allow a 1-day gap if today wasn't watched yet
            if (!watched.Contains(anchor)) anchor = anchor.AddDays(-1);
            while (watched.Contains(anchor))
            {
                currentStreak++;
                anchor = anchor.AddDays(-1);
            }

            return new
            {
                Weeks = weeks,
                Days = days,
                CurrentStreak = currentStreak,
                BestStreak = profile.Counters.BestWatchStreak,
                ActiveDays = activeInWindow
            };
        }
    }

    public object GetSmartGoals(string userId, int limit = 5)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile)) return new { Goals = Array.Empty<object>() };
            EvaluateBadges(profile, userId, silent: true);

            var defs = GetActiveDefinitions().ToDictionary(d => d.Id, d => d, StringComparer.OrdinalIgnoreCase);
            var goals = new List<object>();

            // Priority 1: badges with ETA <= 3 days (hot goals)
            var daysActive = CalendarDaysSinceFirstWatch(profile.Counters);
            var close = profile.Badges
                .Where(b => !b.Unlocked && IsBadgeEnabled(b.Id))
                .Select(b => new { Badge = b, Def = defs.TryGetValue(b.Id, out var d) ? d : null })
                .Where(x => x.Def != null && x.Def.TargetValue > 0)
                .Select(x => new
                {
                    x.Badge,
                    x.Def,
                    Remaining = x.Def!.TargetValue - x.Badge.CurrentValue,
                    Pct = (double)x.Badge.CurrentValue / x.Def!.TargetValue
                })
                .Where(x => x.Remaining > 0 && x.Pct >= 0.4)
                .OrderByDescending(x => x.Pct)
                .Take(limit)
                .ToList();

            foreach (var item in close)
            {
                var action = GenerateGoalAction(item.Def!.Metric, item.Remaining);
                goals.Add(new
                {
                    BadgeId = item.Badge.Id,
                    Title = item.Badge.Title,
                    Action = action,
                    Remaining = item.Remaining,
                    Target = item.Def!.TargetValue,
                    Current = item.Badge.CurrentValue,
                    Rarity = item.Badge.Rarity
                });
            }

            // Add a streak preservation goal if the user has a streak going
            var watchedToday = profile.Counters.WatchDates.Contains(DateTime.Today.ToString("yyyy-MM-dd"));
            if (!watchedToday && profile.Counters.LastWatchDate.HasValue)
            {
                var yesterday = DateOnly.FromDateTime(DateTime.Today.AddDays(-1));
                if (profile.Counters.LastWatchDate.Value >= yesterday)
                {
                    var streak = profile.Counters.BestWatchStreak;
                    goals.Insert(0, new
                    {
                        BadgeId = (string?)null,
                        Title = "Keep your streak alive",
                        Action = "Watch any item today to keep the streak going",
                        Remaining = 1,
                        Target = 1,
                        Current = 0,
                        Rarity = "Legendary"
                    });
                }
            }

            return new { Goals = goals };
        }
    }

    private static string GenerateGoalAction(AchievementMetric metric, int remaining)
    {
        return metric switch
        {
            AchievementMetric.MoviesWatched => "Watch " + remaining + " more movie" + (remaining == 1 ? "" : "s"),
            AchievementMetric.TotalItemsWatched => "Watch " + remaining + " more item" + (remaining == 1 ? "" : "s"),
            AchievementMetric.SeriesCompleted => "Finish " + remaining + " more series",
            AchievementMetric.LateNightSessions => "Have " + remaining + " more late-night session" + (remaining == 1 ? "" : "s"),
            AchievementMetric.EarlyMorningSessions => "Catch " + remaining + " more early-morning session" + (remaining == 1 ? "" : "s"),
            AchievementMetric.WeekendSessions => "Have " + remaining + " more weekend session" + (remaining == 1 ? "" : "s"),
            AchievementMetric.UniqueDecadesWatched => "Watch from " + remaining + " new decade" + (remaining == 1 ? "" : "s"),
            AchievementMetric.UniqueCountriesWatched => "Watch from " + remaining + " new countr" + (remaining == 1 ? "y" : "ies"),
            AchievementMetric.UniqueLanguagesWatched => "Watch in " + remaining + " new language" + (remaining == 1 ? "" : "s"),
            AchievementMetric.UniqueGenresWatched => "Explore " + remaining + " new genre" + (remaining == 1 ? "" : "s"),
            AchievementMetric.UniqueLibrariesVisited => "Watch from " + remaining + " new librar" + (remaining == 1 ? "y" : "ies"),
            AchievementMetric.TotalMinutesWatched => "Watch " + Math.Round(remaining / 60.0) + " more hour" + (remaining < 120 ? "" : "s"),
            AchievementMetric.DaysWatched => "Watch on " + remaining + " more day" + (remaining == 1 ? "" : "s"),
            AchievementMetric.RewatchCount => "Rewatch " + remaining + " more item" + (remaining == 1 ? "" : "s"),
            _ => remaining + " more needed"
        };
    }

    public void RecordCompareHistory(string userIdA, string userIdB)
    {
        userIdA = NormalizeUserId(userIdA);
        userIdB = NormalizeUserId(userIdB);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userIdA, out var profileA)) return;
            if (!_userProfiles.TryGetValue(userIdB, out var profileB)) return;

            profileA.CompareHistory.RemoveAll(e => e.OtherUserId.Equals(userIdB, StringComparison.OrdinalIgnoreCase));
            profileA.CompareHistory.Insert(0, new CompareHistoryEntry
            {
                OtherUserId = userIdB,
                OtherUserName = ResolveUserName(userIdB),
                At = DateTimeOffset.UtcNow
            });
            if (profileA.CompareHistory.Count > 10) profileA.CompareHistory = profileA.CompareHistory.Take(10).ToList();
            Save();
        }
    }

    public List<CompareHistoryEntry> GetCompareHistory(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            return _userProfiles.TryGetValue(userId, out var profile)
                ? profile.CompareHistory.ToList()
                : new List<CompareHistoryEntry>();
        }
    }

    public UserNotificationPreferences GetUserPreferences(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile)) return new UserNotificationPreferences();
            return profile.Preferences;
        }
    }

    public void SaveUserPreferences(string userId, UserNotificationPreferences prefs)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            profile.Preferences = prefs ?? new UserNotificationPreferences();
            Save();
        }
    }

    public object RecordCoWatch(string itemId, string userIdA, string userIdB)
    {
        userIdA = NormalizeUserId(userIdA);
        userIdB = NormalizeUserId(userIdB);
        lock (_lock)
        {
            var a = GetOrCreateProfile(userIdA);
            var b = GetOrCreateProfile(userIdB);
            if (!a.Preferences.EnableCoWatchBonus || !b.Preferences.EnableCoWatchBonus)
                return new { Success = false };
            var bonus = 20;
            a.ScoreBank += bonus;
            b.ScoreBank += bonus;
            Save();
            _auditLog?.Log(userIdA, ResolveUserName(userIdA), "co-watch", "with " + ResolveUserName(userIdB) + " (+" + bonus + " bank)");
            _auditLog?.Log(userIdB, ResolveUserName(userIdB), "co-watch", "with " + ResolveUserName(userIdA) + " (+" + bonus + " bank)");
            return new { Success = true, Bonus = bonus };
        }
    }

    public object GetBadgeEtas(string userId, int limit = 20)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile))
                return new { Etas = Array.Empty<object>() };

            EvaluateBadges(profile, userId, silent: true);
            var c = profile.Counters;
            var daysActive = CalendarDaysSinceFirstWatch(c);

            var perDay = new Dictionary<AchievementMetric, double>
            {
                [AchievementMetric.TotalItemsWatched] = (double)c.TotalItemsWatched / daysActive,
                [AchievementMetric.MoviesWatched] = (double)c.MoviesWatched / daysActive,
                [AchievementMetric.SeriesCompleted] = (double)c.SeriesCompleted / daysActive,
                [AchievementMetric.LateNightSessions] = (double)c.LateNightSessions / daysActive,
                [AchievementMetric.EarlyMorningSessions] = (double)c.EarlyMorningSessions / daysActive,
                [AchievementMetric.WeekendSessions] = (double)c.WeekendSessions / daysActive,
                [AchievementMetric.DaysWatched] = 1.0,
                [AchievementMetric.DaysLoggedIn] = (double)c.DaysLoggedIn / Math.Max(1, daysActive),
                [AchievementMetric.TotalMinutesWatched] = (double)c.TotalMinutesWatched / daysActive,
                [AchievementMetric.RewatchCount] = (double)c.RewatchCount / daysActive
            };

            var unlockedDefs = GetActiveDefinitions().ToDictionary(d => d.Id, d => d, StringComparer.OrdinalIgnoreCase);
            var etas = new List<object>();

            foreach (var badge in profile.Badges.Where(b => !b.Unlocked && IsBadgeEnabled(b.Id)))
            {
                if (!unlockedDefs.TryGetValue(badge.Id, out var def)) continue;
                var remaining = def.TargetValue - badge.CurrentValue;
                if (remaining <= 0) continue;

                int? daysRemaining = null;
                if (perDay.TryGetValue(def.Metric, out var rate) && rate > 0)
                {
                    daysRemaining = (int)Math.Ceiling(remaining / rate);
                    if (daysRemaining > 9999) daysRemaining = 9999;
                }

                etas.Add(new
                {
                    BadgeId = badge.Id,
                    Title = badge.Title,
                    Current = badge.CurrentValue,
                    Target = def.TargetValue,
                    DaysRemaining = daysRemaining,
                    Velocity = perDay.TryGetValue(def.Metric, out var v) ? v : (double?)null
                });
            }

            return new { Etas = etas };
        }
    }

    public object GetYearlyWrapped(string userId, int year)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile))
                return new { Year = year, Empty = true };

            var c = profile.Counters;
            var prefix = year + "-";

            int moviesInYear = 0, episodesInYear = 0, daysActiveInYear = 0, latestMaxInDay = 0;
            string? topDay = null;
            var dayTotals = new Dictionary<string, int>();
            var monthTotals = new Dictionary<int, int>();
            var dowTotals = new Dictionary<int, int>();

            foreach (var kvp in c.MoviesByDate)
            {
                if (!kvp.Key.StartsWith(prefix)) continue;
                moviesInYear += kvp.Value;
                dayTotals.TryGetValue(kvp.Key, out var dt);
                dayTotals[kvp.Key] = dt + kvp.Value;
            }
            foreach (var kvp in c.EpisodesByDate)
            {
                if (!kvp.Key.StartsWith(prefix)) continue;
                episodesInYear += kvp.Value;
                dayTotals.TryGetValue(kvp.Key, out var dt);
                dayTotals[kvp.Key] = dt + kvp.Value;
            }

            foreach (var kvp in dayTotals)
            {
                if (kvp.Value > latestMaxInDay) { latestMaxInDay = kvp.Value; topDay = kvp.Key; }
                if (DateOnly.TryParse(kvp.Key, out var d))
                {
                    monthTotals.TryGetValue(d.Month, out var m);
                    monthTotals[d.Month] = m + kvp.Value;
                    dowTotals.TryGetValue((int)d.DayOfWeek, out var dw);
                    dowTotals[(int)d.DayOfWeek] = dw + kvp.Value;
                }
            }

            daysActiveInYear = c.WatchDates.Count(d => d.StartsWith(prefix));

            var topMonth = monthTotals.OrderByDescending(kvp => kvp.Value).FirstOrDefault();
            var topDow = dowTotals.OrderByDescending(kvp => kvp.Value).FirstOrDefault();
            var monthNames = new[] { "", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" };
            var dowNames = new[] { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };

            // We don't have time-of-day stored, so use lifetime totals as fallback for genres etc.
            var topGenres = c.GenreItemCounts.OrderByDescending(kv => kv.Value).Take(5).Select(kv => new { Name = kv.Key, Count = kv.Value }).ToList();
            var topDirectors = c.DirectorItemCounts.OrderByDescending(kv => kv.Value).Take(5).Select(kv => new { Name = kv.Key, Count = kv.Value }).ToList();
            var topActors = c.ActorItemCounts.OrderByDescending(kv => kv.Value).Take(5).Select(kv => new { Name = kv.Key, Count = kv.Value }).ToList();

            return new
            {
                Year = year,
                Empty = (moviesInYear + episodesInYear) == 0,
                MoviesWatched = moviesInYear,
                EpisodesWatched = episodesInYear,
                TotalItemsWatched = moviesInYear + episodesInYear,
                ActiveDays = daysActiveInYear,
                BiggestDay = topDay,
                BiggestDayCount = latestMaxInDay,
                TopMonth = topMonth.Key > 0 ? monthNames[topMonth.Key] : null,
                TopMonthCount = topMonth.Value,
                TopDayOfWeek = topDow.Key >= 0 && topDow.Key < dowNames.Length ? dowNames[topDow.Key] : null,
                TopDayOfWeekCount = topDow.Value,
                TopGenres = topGenres,
                TopDirectors = topDirectors,
                TopActors = topActors,
                BestStreak = c.BestWatchStreak,
                TotalHoursWatched = c.TotalMinutesWatched / 60
            };
        }
    }

    public Dictionary<int, int> GetWatchHourClock(string userId)
    {
        userId = NormalizeUserId(userId);
        var result = new Dictionary<int, int>();
        for (var h = 0; h < 24; h++) result[h] = 0;
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile)) return result;
            var c = profile.Counters;
            // We don't store per-hour data directly; approximate using LateNight (23-5),
            // EarlyMorning (5-9), evening, etc. distributed across known windows.
            var totalKnown = c.LateNightSessions + c.EarlyMorningSessions + c.WeekendSessions;
            // Late night spread across 23, 0, 1, 2, 3, 4
            var lnHours = new[] { 23, 0, 1, 2, 3, 4 };
            foreach (var h in lnHours) result[h] += c.LateNightSessions / lnHours.Length;
            // Early morning spread across 5, 6, 7, 8
            var emHours = new[] { 5, 6, 7, 8 };
            foreach (var h in emHours) result[h] += c.EarlyMorningSessions / emHours.Length;
            // Other items distributed proportionally to remaining hours (9-22) using prime time weight
            var remaining = Math.Max(0, c.TotalItemsWatched - c.LateNightSessions - c.EarlyMorningSessions);
            var primeWeights = new int[] { 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 4, 3, 2 }; // 9..22
            var weightSum = 0; foreach (var w in primeWeights) weightSum += w;
            for (var i = 0; i < primeWeights.Length; i++)
            {
                var hour = 9 + i;
                result[hour] += (int)Math.Round((double)remaining * primeWeights[i] / weightSum);
            }
            return result;
        }
    }

    public object PinBadge(string userId, string badgeId, bool pinned)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            if (pinned)
            {
                if (!profile.PinnedBadgeIds.Any(id => id.Equals(badgeId, StringComparison.OrdinalIgnoreCase)))
                {
                    profile.PinnedBadgeIds.Add(badgeId);
                }
            }
            else
            {
                profile.PinnedBadgeIds.RemoveAll(id => id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));
            }
            Save();
            return new { Success = true, Pinned = profile.PinnedBadgeIds };
        }
    }

    public object EquipTitle(string userId, string? badgeId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            if (string.IsNullOrEmpty(badgeId))
            {
                profile.EquippedTitleBadgeId = null;
            }
            else
            {
                var badge = profile.Badges.FirstOrDefault(b => b.Id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));
                if (badge is null || !badge.Unlocked) return new { Success = false, Message = "Badge not unlocked." };
                profile.EquippedTitleBadgeId = badge.Id;
            }
            Save();
            return new { Success = true, EquippedTitleBadgeId = profile.EquippedTitleBadgeId };
        }
    }

    public object GetEquippedTitle(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            if (!_userProfiles.TryGetValue(userId, out var profile)) return new { };
            if (string.IsNullOrEmpty(profile.EquippedTitleBadgeId)) return new { Title = (string?)null };
            var badge = profile.Badges.FirstOrDefault(b => b.Id.Equals(profile.EquippedTitleBadgeId, StringComparison.OrdinalIgnoreCase));
            return new { Title = badge?.Title, Rarity = badge?.Rarity };
        }
    }

    public Dictionary<string, int> GetWatchCalendar(string userId, int days = 90)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var result = new Dictionary<string, int>();
            if (!_userProfiles.TryGetValue(userId, out var profile))
            {
                return result;
            }

            var c = profile.Counters;
            var cutoff = DateOnly.FromDateTime(DateTime.Today.AddDays(-days));

            foreach (var kvp in c.MoviesByDate)
            {
                if (!DateOnly.TryParse(kvp.Key, out var d) || d < cutoff) continue;
                result.TryGetValue(kvp.Key, out var cur);
                result[kvp.Key] = cur + kvp.Value;
            }

            foreach (var kvp in c.EpisodesByDate)
            {
                if (!DateOnly.TryParse(kvp.Key, out var d) || d < cutoff) continue;
                result.TryGetValue(kvp.Key, out var cur);
                result[kvp.Key] = cur + kvp.Value;
            }

            // Also include WatchDates that weren't captured in MoviesByDate/EpisodesByDate (legacy)
            foreach (var date in c.WatchDates)
            {
                if (!DateOnly.TryParse(date, out var d) || d < cutoff) continue;
                if (!result.ContainsKey(date))
                {
                    result[date] = 1;
                }
            }

            return result;
        }
    }

    public int EvaluateAllProfiles()
    {
        lock (_lock)
        {
            var count = 0;
            // Use a timestamp from a few minutes ago so unlocks from the startup eval
            // don't trigger toasts on any client that happens to be polling.
            var stamp = DateTimeOffset.UtcNow.AddMinutes(-5);
            foreach (var profile in _userProfiles.Values.ToList())
            {
                try
                {
                    SyncDefinitions(profile, profile.UserId);
                    EvaluateBadges(profile, profile.UserId, silent: true, unlockTimestamp: stamp);
                    count++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[AchievementBadges] EvaluateAll failed for user {UserId}", profile.UserId);
                }
            }
            Save();
            _logger.LogInformation("[AchievementBadges] Re-evaluated {Count} user profiles on startup.", count);
            return count;
        }
    }

    public UserAchievementProfile? PeekProfile(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            return _userProfiles.TryGetValue(userId, out var profile) ? profile : null;
        }
    }

    public void SaveProfileDirect(UserAchievementProfile profile)
    {
        lock (_lock)
        {
            _userProfiles[NormalizeUserId(profile.UserId)] = profile;
            Save();
        }
    }

    public object PrestigeReset(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            var currentScore = AchievementScoreHelper.GetTotalUnlockedScore(profile.Badges.Where(b => IsBadgeEnabled(b.Id)));
            if (currentScore < 12000)
            {
                return new { Success = false, Message = "You need at least 12000 score (Legend rank) to prestige." };
            }

            profile.PrestigeLevel++;
            profile.LifetimeScore += currentScore;
            profile.ScoreBank = Math.Max(profile.ScoreBank, 0);

            // Reset counters + badges but preserve prestige/lifetime/bank/bought
            profile.Counters = new UserAchievementCounters();
            profile.Badges = GetActiveDefinitions().Select(def => CreateBadgeFromDefinition(def, userId)).ToList();
            profile.EquippedBadgeIds = new List<string>();
            profile.BoughtBadgeIds = new List<string>();

            Save();
            return new { Success = true, PrestigeLevel = profile.PrestigeLevel, LifetimeScore = profile.LifetimeScore };
        }
    }

    public object SpendScoreForBadge(string userId, string badgeId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            var def = GetActiveDefinitions().FirstOrDefault(d => d.Id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));
            if (def is null) return new { Success = false, Message = "Badge not found." };

            var cost = GetPurchaseCost(def.Rarity);
            if (profile.ScoreBank < cost)
            {
                return new { Success = false, Message = $"Not enough score bank. Need {cost}, have {profile.ScoreBank}." };
            }

            var badge = profile.Badges.FirstOrDefault(b => b.Id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));
            if (badge is null || badge.Unlocked)
            {
                return new { Success = false, Message = "Already unlocked or missing." };
            }

            profile.ScoreBank -= cost;
            badge.Unlocked = true;
            badge.UnlockedAt = DateTimeOffset.UtcNow;
            badge.CurrentValue = badge.TargetValue;
            profile.BoughtBadgeIds.Add(badge.Id);
            Save();
            return new { Success = true, Cost = cost, RemainingBank = profile.ScoreBank };
        }
    }

    public object GiftScore(string fromUserId, string toUserId, int amount)
    {
        if (amount <= 0) return new { Success = false, Message = "Amount must be positive." };
        fromUserId = NormalizeUserId(fromUserId);
        toUserId = NormalizeUserId(toUserId);
        if (fromUserId == toUserId) return new { Success = false, Message = "Can't gift to yourself." };

        lock (_lock)
        {
            var from = GetOrCreateProfile(fromUserId);
            var to = GetOrCreateProfile(toUserId);
            if (from.ScoreBank < amount) return new { Success = false, Message = "Insufficient score bank." };

            from.ScoreBank -= amount;
            to.ScoreBank += amount;
            Save();
            return new { Success = true, FromRemaining = from.ScoreBank, ToBalance = to.ScoreBank };
        }
    }

    public object ExportProfile(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            return _userProfiles.TryGetValue(userId, out var profile)
                ? (object)profile
                : new { };
        }
    }

    public void ImportProfile(string userId, UserAchievementProfile profile)
    {
        userId = NormalizeUserId(userId);
        if (profile is null) return;
        profile.UserId = userId;
        lock (_lock)
        {
            _userProfiles[userId] = profile;
            SyncDefinitions(profile, userId);
            EvaluateBadges(profile, userId);
            Save();
        }
    }

    public void ResetBadge(string userId, string badgeId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            var badge = profile.Badges.FirstOrDefault(b => b.Id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));
            if (badge is null) return;
            badge.Unlocked = false;
            badge.UnlockedAt = null;
            badge.CurrentValue = 0;
            profile.EquippedBadgeIds.RemoveAll(id => id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));
            profile.BoughtBadgeIds.RemoveAll(id => id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));
            Save();
        }
    }

    public void InjectCounters(string userId, Dictionary<string, long> updates)
    {
        if (updates is null) return;
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            var c = profile.Counters;
            foreach (var kvp in updates)
            {
                switch (kvp.Key)
                {
                    case nameof(c.TotalItemsWatched): c.TotalItemsWatched = (int)kvp.Value; break;
                    case nameof(c.MoviesWatched): c.MoviesWatched = (int)kvp.Value; break;
                    case nameof(c.SeriesCompleted): c.SeriesCompleted = (int)kvp.Value; break;
                    case nameof(c.LateNightSessions): c.LateNightSessions = (int)kvp.Value; break;
                    case nameof(c.EarlyMorningSessions): c.EarlyMorningSessions = (int)kvp.Value; break;
                    case nameof(c.WeekendSessions): c.WeekendSessions = (int)kvp.Value; break;
                    case nameof(c.BestWatchStreak): c.BestWatchStreak = (int)kvp.Value; break;
                    case nameof(c.TotalMinutesWatched): c.TotalMinutesWatched = kvp.Value; break;
                    case nameof(c.LongestItemMinutes): c.LongestItemMinutes = (int)kvp.Value; break;
                    case nameof(c.ShortItemsWatched): c.ShortItemsWatched = (int)kvp.Value; break;
                    case nameof(c.RewatchCount): c.RewatchCount = (int)kvp.Value; break;
                    case nameof(c.LongSeriesCompleted): c.LongSeriesCompleted = (int)kvp.Value; break;
                    case nameof(c.VeryLongSeriesCompleted): c.VeryLongSeriesCompleted = (int)kvp.Value; break;
                    case nameof(c.BestLoginStreak): c.BestLoginStreak = (int)kvp.Value; break;
                }
            }
            EvaluateBadges(profile, userId);
            Save();
        }
    }

    private static int GetPurchaseCost(string? rarity)
    {
        return (rarity ?? string.Empty).ToLowerInvariant() switch
        {
            "common" => 150,
            "uncommon" => 300,
            "rare" => 600,
            "epic" => 1200,
            "legendary" => 2500,
            "mythic" => 5000,
            _ => 400
        };
    }

    public void UpdateLibraryCompletionPercents(string userId, Dictionary<string, int> percents)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            profile.Counters.LibraryCompletionPercents = percents ?? new Dictionary<string, int>();
            EvaluateBadges(profile, userId);
            Save();
        }
    }

    public void RegisterLogin(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            var today = DateOnly.FromDateTime(DateTime.Today);
            var key = today.ToString("yyyy-MM-dd");

            profile.Counters.LoginDates.Add(key);

            var streak = profile.Counters.CurrentLoginStreak;
            if (streak > profile.Counters.BestLoginStreak)
            {
                profile.Counters.BestLoginStreak = streak;
            }

            profile.Counters.LastLoginDate = today;
            EvaluateBadges(profile, userId);
            Save();
        }
    }

    public List<AchievementDefinition> GetActiveDefinitions()
    {
        var all = new List<AchievementDefinition>(AchievementDefinitions.All);

        var config = Plugin.Instance?.Configuration;
        if (config is null)
        {
            return all;
        }

        foreach (var custom in config.CustomBadges ?? new())
        {
            if (string.IsNullOrWhiteSpace(custom.Id)) continue;
            custom.IsCustom = true;
            all.Add(custom);
        }

        var now = DateTimeOffset.Now;
        foreach (var challenge in config.Challenges ?? new())
        {
            if (string.IsNullOrWhiteSpace(challenge.Id)) continue;
            challenge.IsChallenge = true;
            var started = !challenge.ChallengeStart.HasValue || challenge.ChallengeStart.Value <= now;
            var notEnded = !challenge.ChallengeEnd.HasValue || challenge.ChallengeEnd.Value >= now;
            if (started && notEnded)
            {
                all.Add(challenge);
            }
            else if (!notEnded)
            {
                // Keep ended challenges visible so users who earned them keep the badge.
                all.Add(challenge);
            }
        }

        return all;
    }

    public List<AchievementBadge> GetBadgesForUser(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            EvaluateBadges(profile, userId);
            Save();
            return GetEnabledBadgeClones(profile);
        }
    }

    public List<AchievementBadge> GetAllBadgesForUserIncludingDisabled(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            EvaluateBadges(profile, userId);
            Save();
            return profile.Badges.Select(CloneBadge).ToList();
        }
    }

    public AchievementBadge? GetBadge(string userId, string badgeId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            EvaluateBadges(profile, userId);

            if (!IsBadgeEnabled(badgeId))
            {
                return null;
            }

            var badge = profile.Badges.FirstOrDefault(b => b.Id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));
            return badge is null ? null : CloneBadge(badge);
        }
    }

    public List<AchievementBadge> GetEquippedBadges(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            EvaluateBadges(profile, userId);

            var equipped = profile.EquippedBadgeIds
                .Where(IsBadgeEnabled)
                .Select(id => profile.Badges.FirstOrDefault(b => b.Id.Equals(id, StringComparison.OrdinalIgnoreCase)))
                .Where(b => b is not null)
                .Select(b => CloneBadge(b!))
                .ToList();

            return equipped;
        }
    }

    public bool EquipBadge(string userId, string badgeId, out string message)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            EvaluateBadges(profile, userId);

            var badge = profile.Badges.FirstOrDefault(b => b.Id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));

            if (badge is null)
            {
                message = "Badge not found.";
                return false;
            }

            if (!badge.Unlocked)
            {
                message = "Only unlocked badges can be equipped.";
                return false;
            }

            if (profile.EquippedBadgeIds.Any(x => x.Equals(badgeId, StringComparison.OrdinalIgnoreCase)))
            {
                message = "Badge is already equipped.";
                return true;
            }

            if (profile.EquippedBadgeIds.Count >= 5)
            {
                message = "You can only equip up to 5 badges.";
                return false;
            }

            profile.EquippedBadgeIds.Add(badge.Id);
            Save();

            _logger.LogInformation("Equipped badge {BadgeId} for user {UserId}", badgeId, userId);

            message = "Badge equipped.";
            return true;
        }
    }

    public bool UnequipBadge(string userId, string badgeId, out string message)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);

            var removed = profile.EquippedBadgeIds.RemoveAll(x => x.Equals(badgeId, StringComparison.OrdinalIgnoreCase));

            if (removed == 0)
            {
                message = "Badge was not equipped.";
                return false;
            }

            Save();

            _logger.LogInformation("Unequipped badge {BadgeId} for user {UserId}", badgeId, userId);

            message = "Badge unequipped.";
            return true;
        }
    }

    public AchievementBadge? UpdateProgress(string userId, string badgeId, int amount)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            var badge = profile.Badges.FirstOrDefault(b => b.Id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));

            if (badge is null)
            {
                return null;
            }

            if (!badge.Unlocked)
            {
                badge.CurrentValue = Math.Clamp(badge.CurrentValue + amount, 0, badge.TargetValue);

                if (badge.CurrentValue >= badge.TargetValue)
                {
                    badge.CurrentValue = badge.TargetValue;
                    badge.Unlocked = true;
                    badge.UnlockedAt = DateTimeOffset.UtcNow;
                    _logger.LogInformation("Unlocked badge {BadgeId} for user {UserId}", badgeId, userId);
                }

                Save();

                _logger.LogInformation(
                    "Updated badge {BadgeId} for user {UserId}: {Current}/{Target}",
                    badgeId,
                    userId,
                    badge.CurrentValue,
                    badge.TargetValue);
            }

            return CloneBadge(badge);
        }
    }

    public AchievementBadge? UnlockBadge(string userId, string badgeId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            var badge = profile.Badges.FirstOrDefault(b => b.Id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));

            if (badge is null)
            {
                return null;
            }

            if (!badge.Unlocked)
            {
                badge.Unlocked = true;
                badge.UnlockedAt = DateTimeOffset.UtcNow;
                badge.CurrentValue = badge.TargetValue;
                Save();
                _logger.LogInformation("Force unlocked badge {BadgeId} for user {UserId}", badgeId, userId);
            }

            return CloneBadge(badge);
        }
    }

    public List<AchievementBadge> ResetBadgesForUser(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = CreateProfile(userId);
            _userProfiles[userId] = profile;
            Save();
            _logger.LogInformation("Reset badges for user {UserId}", userId);
            return profile.Badges.Select(CloneBadge).ToList();
        }
    }

    public List<AchievementBadge> RecordPlayback(
        string userId,
        bool isMovie = false,
        bool isEpisode = false,
        bool seriesCompleted = false,
        string? libraryName = null,
        DateTimeOffset? playedAt = null)
    {
        return RecordPlayback(new PlaybackContext
        {
            UserId = userId,
            IsMovie = isMovie,
            IsEpisode = isEpisode,
            SeriesCompleted = seriesCompleted,
            LibraryName = libraryName,
            PlayedAt = playedAt
        });
    }

    public List<AchievementBadge> RecordPlayback(PlaybackContext context)
    {
        var userId = NormalizeUserId(context.UserId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            var counters = profile.Counters;
            var timestamp = context.PlayedAt ?? DateTimeOffset.Now;
            var dayKey = timestamp.ToString("yyyy-MM-dd");
            var today = DateOnly.FromDateTime(timestamp.DateTime);

            counters.TotalItemsWatched++;
            counters.WatchDates.Add(dayKey);

            if (counters.LastWatchDate == null)
            {
                counters.LastWatchDate = today;
            }
            else
            {
                var diff = today.DayNumber - counters.LastWatchDate.Value.DayNumber;

                if (diff >= 1)
                {
                    counters.LastWatchDate = today;
                }
            }

            var currentStreak = GetCurrentWatchStreak(counters);
            if (currentStreak > counters.BestWatchStreak)
            {
                counters.BestWatchStreak = currentStreak;
            }

            if (!string.IsNullOrWhiteSpace(context.LibraryName))
            {
                counters.LibrariesVisited.Add(context.LibraryName.Trim());
            }

            if (context.IsMovie)
            {
                counters.MoviesWatched++;

                if (!counters.MoviesByDate.ContainsKey(dayKey))
                {
                    counters.MoviesByDate[dayKey] = 0;
                }

                counters.MoviesByDate[dayKey]++;
            }

            if (context.IsEpisode)
            {
                if (!counters.EpisodesByDate.ContainsKey(dayKey))
                {
                    counters.EpisodesByDate[dayKey] = 0;
                }

                counters.EpisodesByDate[dayKey]++;
            }

            if (context.SeriesCompleted)
            {
                counters.SeriesCompleted++;

                if (context.CompletedSeriesEpisodeCount >= 50)
                {
                    counters.LongSeriesCompleted++;
                }

                if (context.CompletedSeriesEpisodeCount >= 100)
                {
                    counters.VeryLongSeriesCompleted++;
                }
            }

            if (context.IsRewatch)
            {
                counters.RewatchCount++;
            }

            if (context.ProductionYear is int year && year > 0)
            {
                var decade = year / 10 * 10;
                counters.DecadesWatched.Add(decade);
                var decadeKey = decade.ToString();
                counters.DecadeItemCounts.TryGetValue(decadeKey, out var decCount);
                counters.DecadeItemCounts[decadeKey] = decCount + 1;
            }

            // Day-of-week count
            var dowKey = timestamp.DayOfWeek.ToString();
            counters.DayOfWeekItemCounts.TryGetValue(dowKey, out var dowCount);
            counters.DayOfWeekItemCounts[dowKey] = dowCount + 1;

            // Per-day total minutes
            if (context.RunTimeTicks is long rtTicks && rtTicks > 0)
            {
                var minutes = (int)(rtTicks / TimeSpan.TicksPerMinute);
                counters.MinutesByDate.TryGetValue(dayKey, out var dayMins);
                counters.MinutesByDate[dayKey] = dayMins + minutes;
            }

            if (context.ProductionLocations is { Count: > 0 })
            {
                foreach (var loc in context.ProductionLocations)
                {
                    if (!string.IsNullOrWhiteSpace(loc))
                    {
                        counters.CountriesWatched.Add(loc.Trim());
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(context.OriginalLanguage))
            {
                counters.LanguagesWatched.Add(context.OriginalLanguage.Trim().ToLowerInvariant());
            }

            if (context.Genres is { Count: > 0 })
            {
                foreach (var genre in context.Genres)
                {
                    if (string.IsNullOrWhiteSpace(genre)) continue;
                    var trimmed = genre.Trim();
                    counters.GenresWatched.Add(trimmed);
                    counters.GenreItemCounts.TryGetValue(trimmed, out var gc);
                    counters.GenreItemCounts[trimmed] = gc + 1;
                }
            }

            if (context.Directors is { Count: > 0 })
            {
                foreach (var director in context.Directors)
                {
                    if (string.IsNullOrWhiteSpace(director)) continue;
                    var trimmed = director.Trim();
                    counters.DirectorItemCounts.TryGetValue(trimmed, out var dc);
                    counters.DirectorItemCounts[trimmed] = dc + 1;
                }

                if (counters.DirectorItemCounts.Count > 200)
                {
                    var keep = counters.DirectorItemCounts
                        .OrderByDescending(kvp => kvp.Value)
                        .Take(100)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
                    counters.DirectorItemCounts = keep;
                }
            }

            if (context.Actors is { Count: > 0 })
            {
                foreach (var actor in context.Actors)
                {
                    if (string.IsNullOrWhiteSpace(actor)) continue;
                    var trimmed = actor.Trim();
                    counters.ActorItemCounts.TryGetValue(trimmed, out var ac);
                    counters.ActorItemCounts[trimmed] = ac + 1;
                }

                if (counters.ActorItemCounts.Count > 500)
                {
                    var keep = counters.ActorItemCounts
                        .OrderByDescending(kvp => kvp.Value)
                        .Take(200)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
                    counters.ActorItemCounts = keep;
                }
            }

            if (!string.IsNullOrWhiteSpace(context.LibraryName))
            {
                var libKey = context.LibraryName.Trim();
                counters.LibraryItemCounts.TryGetValue(libKey, out var lc);
                counters.LibraryItemCounts[libKey] = lc + 1;
            }

            if (context.RunTimeTicks is long ticks && ticks > 0)
            {
                var minutes = (int)(ticks / TimeSpan.TicksPerMinute);
                counters.TotalMinutesWatched += minutes;

                if (minutes > counters.LongestItemMinutes)
                {
                    counters.LongestItemMinutes = minutes;
                }

                if (minutes > 0 && minutes < 30)
                {
                    counters.ShortItemsWatched++;
                }
            }

            if (timestamp.Month == 12 && timestamp.Day == 25)
            {
                counters.WatchedOnChristmas = true;
            }

            if (timestamp.Month == 1 && timestamp.Day == 1)
            {
                counters.WatchedOnNewYear = true;
            }

            if (timestamp.Month == 10 && timestamp.Day == 31)
            {
                counters.WatchedOnHalloween = true;
            }

            if (IsEidWindow(timestamp))
            {
                counters.WatchedOnEid = true;
            }

            var hour = timestamp.Hour;

            if (hour >= 23 || hour < 5)
            {
                counters.LateNightSessions++;
            }

            if (hour >= 5 && hour < 9)
            {
                counters.EarlyMorningSessions++;
            }

            if (timestamp.DayOfWeek == DayOfWeek.Saturday || timestamp.DayOfWeek == DayOfWeek.Sunday)
            {
                counters.WeekendSessions++;
            }

            // Combo multiplier: if watched within 15 minutes of last playback, extend the combo
            var comboMultiplier = 1.0;
            if (profile.LastPlaybackAt is DateTimeOffset last &&
                (timestamp - last).TotalMinutes > 0 &&
                (timestamp - last).TotalMinutes < 15)
            {
                profile.ComboCount++;
                if (profile.ComboCount > profile.BestComboCount)
                {
                    profile.BestComboCount = profile.ComboCount;
                }
                comboMultiplier = 1.0 + Math.Min(profile.ComboCount * 0.1, 1.0);
            }
            else
            {
                profile.ComboCount = 1;
            }
            profile.LastPlaybackAt = timestamp;

            // Base score accrual into the bank: 5 points per watched item, scaled by combo
            var earned = (int)Math.Round(5 * comboMultiplier);
            profile.ScoreBank += earned;

            // For historical backfills, use the original played date as the unlock stamp so the
            // toast poller's "UnlockedAt > LAST_SEEN" check won't match (stops scan-spam toasts).
            var unlockStamp = context.Silent ? timestamp : (DateTimeOffset?)null;
            EvaluateBadges(profile, userId, silent: context.Silent, unlockTimestamp: unlockStamp);
            Save();

            _logger.LogInformation(
                "[AchievementBadges] Recorded playback user={UserId} movie={IsMovie} ep={IsEpisode} seriesDone={SeriesCompleted} library={LibraryName} combo={Combo} earned={Earned}",
                userId,
                context.IsMovie,
                context.IsEpisode,
                context.SeriesCompleted,
                context.LibraryName ?? string.Empty,
                profile.ComboCount,
                earned);

            return GetEnabledBadgeClones(profile);
        }
    }

    public object GetSummary(string userId)
    {
        userId = NormalizeUserId(userId);
        lock (_lock)
        {
            var profile = GetOrCreateProfile(userId);
            EvaluateBadges(profile, userId);

            var enabledBadges = profile.Badges.Where(b => IsBadgeEnabled(b.Id)).ToList();
            var unlocked = enabledBadges.Count(b => b.Unlocked);
            var total = enabledBadges.Count;
            var percentage = total == 0 ? 0 : Math.Round((double)unlocked / total * 100.0, 1);
            var baseScore = AchievementScoreHelper.GetTotalUnlockedScore(enabledBadges);
            var multiplier = 1.0 + 0.5 * profile.PrestigeLevel;
            var score = (int)Math.Round(baseScore * multiplier);
            var equippedCount = profile.EquippedBadgeIds.Count(IsBadgeEnabled);

            return new BadgeSummary
            {
                Unlocked = unlocked,
                Total = total,
                Percentage = percentage,
                EquippedCount = equippedCount,
                Score = score,
                CurrentWatchStreak = GetCurrentWatchStreak(profile.Counters),
                BestWatchStreak = profile.Counters.BestWatchStreak
            };
        }
    }

    public object GetLeaderboardByCategory(string category, int limit = 10)
    {
        lock (_lock)
        {
            var projected = _userProfiles.Values.Select(profile =>
            {
                EvaluateBadges(profile, profile.UserId);
                var counters = profile.Counters;
                var enabled = profile.Badges.Where(b => IsBadgeEnabled(b.Id)).ToList();
                return new
                {
                    UserId = profile.UserId,
                    UserName = ResolveUserName(profile.UserId),
                    Score = AchievementScoreHelper.GetTotalUnlockedScore(enabled),
                    Unlocked = enabled.Count(b => b.Unlocked),
                    Counters = counters
                };
            }).ToList();

            IEnumerable<object> ordered = category?.ToLowerInvariant() switch
            {
                "movies" => projected.OrderByDescending(x => x.Counters.MoviesWatched)
                    .Take(limit).Select(x => (object)new { x.UserId, x.UserName, Value = x.Counters.MoviesWatched }),
                "episodes" => projected.OrderByDescending(x => x.Counters.TotalItemsWatched - x.Counters.MoviesWatched)
                    .Take(limit).Select(x => (object)new { x.UserId, x.UserName, Value = x.Counters.TotalItemsWatched - x.Counters.MoviesWatched }),
                "streak" => projected.OrderByDescending(x => x.Counters.BestWatchStreak)
                    .Take(limit).Select(x => (object)new { x.UserId, x.UserName, Value = x.Counters.BestWatchStreak }),
                "hours" => projected.OrderByDescending(x => x.Counters.TotalMinutesWatched)
                    .Take(limit).Select(x => (object)new { x.UserId, x.UserName, Value = x.Counters.TotalMinutesWatched / 60 }),
                "series" => projected.OrderByDescending(x => x.Counters.SeriesCompleted)
                    .Take(limit).Select(x => (object)new { x.UserId, x.UserName, Value = x.Counters.SeriesCompleted }),
                "unlocked" => projected.OrderByDescending(x => x.Unlocked)
                    .Take(limit).Select(x => (object)new { x.UserId, x.UserName, Value = x.Unlocked }),
                _ => projected.OrderByDescending(x => x.Score)
                    .Take(limit).Select(x => (object)new { x.UserId, x.UserName, Value = x.Score })
            };

            return ordered.ToList();
        }
    }

    public object GetLeaderboard(int limit = 10)
    {
        lock (_lock)
        {
            var entries = _userProfiles.Values
                .Select(profile =>
                {
                    EvaluateBadges(profile, profile.UserId);
                    var enabled = profile.Badges.Where(b => IsBadgeEnabled(b.Id)).ToList();
                    var unlocked = enabled.Count(b => b.Unlocked);
                    var total = enabled.Count;
                    var percentage = total == 0 ? 0 : Math.Round((double)unlocked / total * 100.0, 1);
                    var score = AchievementScoreHelper.GetTotalUnlockedScore(enabled);

                    return new
                    {
                        UserId = profile.UserId,
                        UserName = ResolveUserName(profile.UserId),
                        Unlocked = unlocked,
                        Total = total,
                        Percentage = percentage,
                        Score = score,
                        BestWatchStreak = profile.Counters.BestWatchStreak
                    };
                })
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.BestWatchStreak)
                .ThenByDescending(x => x.Unlocked)
                .ThenByDescending(x => x.Percentage)
                .Take(limit)
                .ToList();

            return entries;
        }
    }

    public object GetServerStats()
    {
        lock (_lock)
        {
            var totalUsers = _userProfiles.Count;
            var totalBadgesUnlocked = _userProfiles.Values.Sum(p => p.Badges.Count(b => b.Unlocked && IsBadgeEnabled(b.Id)));
            var totalItemsWatched = _userProfiles.Values.Sum(p => p.Counters.TotalItemsWatched);
            var totalMoviesWatched = _userProfiles.Values.Sum(p => p.Counters.MoviesWatched);
            var totalSeriesCompleted = _userProfiles.Values.Sum(p => p.Counters.SeriesCompleted);
            var totalAchievementScore = _userProfiles.Values.Sum(p => AchievementScoreHelper.GetTotalUnlockedScore(p.Badges.Where(b => IsBadgeEnabled(b.Id)).ToList()));

            var mostCommonBadge = _userProfiles.Values
                .SelectMany(p => p.Badges.Where(b => b.Unlocked && IsBadgeEnabled(b.Id)))
                .GroupBy(b => b.Id)
                .OrderByDescending(g => g.Count())
                .Select(g => g.First().Title)
                .FirstOrDefault() ?? "None";

            return new ServerStats
            {
                TotalUsers = totalUsers,
                TotalBadgesUnlocked = totalBadgesUnlocked,
                TotalItemsWatched = totalItemsWatched,
                TotalMoviesWatched = totalMoviesWatched,
                TotalSeriesCompleted = totalSeriesCompleted,
                MostCommonBadge = mostCommonBadge,
                TotalAchievementScore = totalAchievementScore
            };
        }
    }

    private static string NormalizeUserId(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return string.Empty;
        }

        if (Guid.TryParse(userId, out var guid))
        {
            return guid.ToString("D");
        }

        return userId.Trim();
    }

    private string ResolveUserName(string userId)
    {
        try
        {
            if (Guid.TryParse(userId, out var guid))
            {
                var user = _userManager.GetUserById(guid);
                if (user != null && !string.IsNullOrWhiteSpace(user.Username))
                {
                    return user.Username;
                }
            }
        }
        catch
        {
        }

        return userId;
    }

    private UserAchievementProfile GetOrCreateProfile(string userId)
    {
        if (!_userProfiles.TryGetValue(userId, out var profile))
        {
            profile = CreateProfile(userId);
            _userProfiles[userId] = profile;
            Save();
            _logger.LogInformation("Created achievement profile for user {UserId}", userId);
        }
        else
        {
            SyncDefinitions(profile, userId);
            SanitizeEquippedBadges(profile);
        }

        return profile;
    }

    private static UserAchievementProfile MergeProfiles(UserAchievementProfile a, UserAchievementProfile b)
    {
        // Prefer the profile with more watch activity; union the rest.
        var primary = b.Counters.TotalItemsWatched > a.Counters.TotalItemsWatched ? b : a;
        var secondary = ReferenceEquals(primary, a) ? b : a;

        foreach (var lib in secondary.Counters.LibrariesVisited)
        {
            primary.Counters.LibrariesVisited.Add(lib);
        }

        foreach (var date in secondary.Counters.WatchDates)
        {
            primary.Counters.WatchDates.Add(date);
        }

        foreach (var pair in secondary.Counters.MoviesByDate)
        {
            if (!primary.Counters.MoviesByDate.ContainsKey(pair.Key) ||
                primary.Counters.MoviesByDate[pair.Key] < pair.Value)
            {
                primary.Counters.MoviesByDate[pair.Key] = pair.Value;
            }
        }

        foreach (var pair in secondary.Counters.EpisodesByDate)
        {
            if (!primary.Counters.EpisodesByDate.ContainsKey(pair.Key) ||
                primary.Counters.EpisodesByDate[pair.Key] < pair.Value)
            {
                primary.Counters.EpisodesByDate[pair.Key] = pair.Value;
            }
        }

        foreach (var badge in secondary.Badges)
        {
            var existing = primary.Badges.FirstOrDefault(x => x.Id.Equals(badge.Id, StringComparison.OrdinalIgnoreCase));
            if (existing is null)
            {
                primary.Badges.Add(badge);
                continue;
            }

            if (badge.CurrentValue > existing.CurrentValue)
            {
                existing.CurrentValue = badge.CurrentValue;
            }

            if (badge.Unlocked && !existing.Unlocked)
            {
                existing.Unlocked = true;
                existing.UnlockedAt = badge.UnlockedAt ?? existing.UnlockedAt;
            }
        }

        foreach (var equipped in secondary.EquippedBadgeIds)
        {
            if (!primary.EquippedBadgeIds.Contains(equipped, StringComparer.OrdinalIgnoreCase))
            {
                primary.EquippedBadgeIds.Add(equipped);
            }
        }

        return primary;
    }

    private UserAchievementProfile CreateProfile(string userId)
    {
        return new UserAchievementProfile
        {
            UserId = userId,
            Counters = new UserAchievementCounters(),
            Badges = GetActiveDefinitions().Select(def => CreateBadgeFromDefinition(def, userId)).ToList(),
            EquippedBadgeIds = new List<string>()
        };
    }

    private void SyncDefinitions(UserAchievementProfile profile, string userId)
    {
        foreach (var def in GetActiveDefinitions())
        {
            var existing = profile.Badges.FirstOrDefault(b => b.Id.Equals(def.Id, StringComparison.OrdinalIgnoreCase));

            if (existing is null)
            {
                profile.Badges.Add(CreateBadgeFromDefinition(def, userId));
                continue;
            }

            existing.Key = def.Key;
            existing.Title = def.Title;
            existing.Description = def.Description;
            existing.Icon = def.Icon;
            existing.Category = def.Category;
            existing.Rarity = def.Rarity;
            existing.TargetValue = def.TargetValue;
        }
    }

    private static void SanitizeEquippedBadges(UserAchievementProfile profile)
    {
        var unlockedIds = profile.Badges
            .Where(b => b.Unlocked && IsBadgeEnabled(b.Id))
            .Select(b => b.Id)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        profile.EquippedBadgeIds = profile.EquippedBadgeIds
            .Where(id => unlockedIds.Contains(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();
    }

    private void EvaluateBadges(UserAchievementProfile profile, string userId, bool silent = false, DateTimeOffset? unlockTimestamp = null)
    {
        var newlyUnlocked = new List<AchievementBadge>();
        var stamp = unlockTimestamp ?? DateTimeOffset.UtcNow;

        foreach (var def in GetActiveDefinitions())
        {
            var badge = profile.Badges.FirstOrDefault(b => b.Id.Equals(def.Id, StringComparison.OrdinalIgnoreCase));
            if (badge is null)
            {
                badge = CreateBadgeFromDefinition(def, userId);
                profile.Badges.Add(badge);
            }

            var current = Math.Clamp(GetMetricValue(profile.Counters, def.Metric, def.MetricParameter, profile), 0, def.TargetValue);

            var wasUnlocked = badge.Unlocked;
            badge.CurrentValue = current;

            if (!badge.Unlocked && current >= def.TargetValue)
            {
                badge.Unlocked = true;
                badge.UnlockedAt = stamp;
                _logger.LogInformation("Unlocked badge {BadgeId} for user {UserId} (silent={Silent})", def.Id, userId, silent);
                newlyUnlocked.Add(badge);
            }

            if (wasUnlocked && badge.UnlockedAt is null)
            {
                badge.UnlockedAt = stamp;
            }
        }

        SanitizeEquippedBadges(profile);

        if (newlyUnlocked.Count > 0 && !silent)
        {
            var userName = ResolveUserName(userId);
            foreach (var badge in newlyUnlocked)
            {
                if (!IsBadgeEnabled(badge.Id)) continue;
                _webhookNotifier?.NotifyUnlock(userName, badge);
                _auditLog?.Log(userId, userName, "unlock", badge.Title + " (" + badge.Rarity + ")");
            }
        }
    }

    private static int GetMetricValue(UserAchievementCounters counters, AchievementMetric metric, string? parameter = null, UserAchievementProfile? profile = null)
    {
        if (metric == AchievementMetric.PrestigeLevel)
        {
            return profile?.PrestigeLevel ?? 0;
        }

        if (metric == AchievementMetric.LifetimeScore)
        {
            return profile?.LifetimeScore ?? 0;
        }

        if (metric == AchievementMetric.BestComboCount)
        {
            return profile?.BestComboCount ?? 0;
        }

        if (metric == AchievementMetric.LibrariesAt100Percent)
        {
            return counters.LibrariesAt100PercentCount;
        }

        if (metric == AchievementMetric.BadgesUnlockedPercent && profile != null)
        {
            var enabled = profile.Badges.Count;
            if (enabled == 0) return 0;
            var unlocked = profile.Badges.Count(b => b.Unlocked);
            return (int)Math.Floor(100.0 * unlocked / enabled);
        }

        if (metric == AchievementMetric.MaxLibraryItemCount)
        {
            return counters.MaxLibraryItemCountValue;
        }

        if (metric == AchievementMetric.MaxMinutesInSingleDay)
        {
            return counters.MaxMinutesInSingleDay;
        }

        if (metric == AchievementMetric.DecadeItemsWatched && !string.IsNullOrWhiteSpace(parameter))
        {
            return counters.DecadeItemCounts.TryGetValue(parameter, out var dec) ? dec : 0;
        }

        if (metric == AchievementMetric.DayOfWeekItemsWatched && !string.IsNullOrWhiteSpace(parameter))
        {
            return counters.DayOfWeekItemCounts.TryGetValue(parameter, out var dow) ? dow : 0;
        }

        if (metric == AchievementMetric.GenreItemsWatched && !string.IsNullOrWhiteSpace(parameter))
        {
            return counters.GenreItemCounts.TryGetValue(parameter, out var g) ? g : 0;
        }

        if (metric == AchievementMetric.PersonItemsWatched && !string.IsNullOrWhiteSpace(parameter))
        {
            if (counters.DirectorItemCounts.TryGetValue(parameter, out var d)) return d;
            if (counters.ActorItemCounts.TryGetValue(parameter, out var a)) return a;
            return 0;
        }

        if (metric == AchievementMetric.LibraryCompletionPercent)
        {
            if (!string.IsNullOrWhiteSpace(parameter))
            {
                return counters.LibraryCompletionPercents.TryGetValue(parameter, out var p) ? p : 0;
            }
            return counters.BestLibraryCompletionPercent;
        }

        return GetSingleMetricValue(counters, metric);
    }

    private static int GetSingleMetricValue(UserAchievementCounters counters, AchievementMetric metric)
    {
        return metric switch
        {
            AchievementMetric.TotalItemsWatched => counters.TotalItemsWatched,
            AchievementMetric.MoviesWatched => counters.MoviesWatched,
            AchievementMetric.SeriesCompleted => counters.SeriesCompleted,
            AchievementMetric.LateNightSessions => counters.LateNightSessions,
            AchievementMetric.EarlyMorningSessions => counters.EarlyMorningSessions,
            AchievementMetric.WeekendSessions => counters.WeekendSessions,
            AchievementMetric.UniqueLibrariesVisited => counters.UniqueLibrariesVisited,
            AchievementMetric.DaysWatched => counters.DaysWatched,
            AchievementMetric.CurrentWatchStreak => GetCurrentWatchStreak(counters),
            AchievementMetric.BestWatchStreak => counters.BestWatchStreak,
            AchievementMetric.MaxEpisodesInSingleDay => counters.MaxEpisodesInSingleDay,
            AchievementMetric.MaxMoviesInSingleDay => counters.MaxMoviesInSingleDay,
            AchievementMetric.UniqueDecadesWatched => counters.UniqueDecadesWatched,
            AchievementMetric.UniqueCountriesWatched => counters.UniqueCountriesWatched,
            AchievementMetric.UniqueLanguagesWatched => counters.UniqueLanguagesWatched,
            AchievementMetric.UniqueGenresWatched => counters.UniqueGenresWatched,
            AchievementMetric.TotalMinutesWatched => counters.TotalMinutesWatched > int.MaxValue ? int.MaxValue : (int)counters.TotalMinutesWatched,
            AchievementMetric.LongestItemMinutes => counters.LongestItemMinutes,
            AchievementMetric.ShortItemsWatched => counters.ShortItemsWatched,
            AchievementMetric.WatchedOnChristmas => counters.WatchedOnChristmas ? 1 : 0,
            AchievementMetric.WatchedOnNewYear => counters.WatchedOnNewYear ? 1 : 0,
            AchievementMetric.WatchedOnHalloween => counters.WatchedOnHalloween ? 1 : 0,
            AchievementMetric.WatchedOnEid => counters.WatchedOnEid ? 1 : 0,
            AchievementMetric.LongSeriesCompleted => counters.LongSeriesCompleted,
            AchievementMetric.VeryLongSeriesCompleted => counters.VeryLongSeriesCompleted,
            AchievementMetric.RewatchCount => counters.RewatchCount,
            AchievementMetric.DaysLoggedIn => counters.DaysLoggedIn,
            AchievementMetric.CurrentLoginStreak => counters.CurrentLoginStreak,
            AchievementMetric.BestLoginStreak => counters.BestLoginStreak,
            AchievementMetric.TopDirectorCount => counters.TopDirectorCount,
            AchievementMetric.TopActorCount => counters.TopActorCount,
            _ => 0
        };
    }

    // Approximate Saudi-calendar Eid al-Fitr and Eid al-Adha start dates.
    // Real dates depend on moon sighting and shift ±1 day regionally; the
    // window below expands each anchor by -1/+2 days so the full
    // celebration period and sighting variance are covered.
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2024 = { (4, 10), (6, 16) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2025 = { (3, 30), (6, 6) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2026 = { (3, 20), (5, 27) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2027 = { (3, 9), (5, 17) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2028 = { (2, 26), (5, 5) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2029 = { (2, 14), (4, 24) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2030 = { (2, 4), (4, 13) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2031 = { (1, 24), (4, 2) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2032 = { (1, 14), (3, 22) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2033 = { (1, 2), (3, 11), (12, 23) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2034 = { (12, 12), (2, 28) };
    private static readonly (int Month, int Day)[] _eidAnchorsByYear2035 = { (12, 2), (2, 18) };

    private static (int Month, int Day)[] GetEidAnchors(int year)
    {
        return year switch
        {
            2024 => _eidAnchorsByYear2024,
            2025 => _eidAnchorsByYear2025,
            2026 => _eidAnchorsByYear2026,
            2027 => _eidAnchorsByYear2027,
            2028 => _eidAnchorsByYear2028,
            2029 => _eidAnchorsByYear2029,
            2030 => _eidAnchorsByYear2030,
            2031 => _eidAnchorsByYear2031,
            2032 => _eidAnchorsByYear2032,
            2033 => _eidAnchorsByYear2033,
            2034 => _eidAnchorsByYear2034,
            2035 => _eidAnchorsByYear2035,
            _ => Array.Empty<(int, int)>()
        };
    }

    private static bool IsEidWindow(DateTimeOffset timestamp)
    {
        var date = timestamp.Date;
        foreach (var anchor in GetEidAnchors(date.Year))
        {
            var anchorDate = new DateTime(date.Year, anchor.Month, anchor.Day);
            var diff = (date - anchorDate).TotalDays;
            if (diff >= -1 && diff <= 3)
            {
                return true;
            }
        }
        return false;
    }

    private static bool IsBadgeEnabled(string badgeId)
    {
        var config = Plugin.Instance?.Configuration;
        if (config?.DisabledBadgeIds is null || config.DisabledBadgeIds.Count == 0)
        {
            return true;
        }

        return !config.DisabledBadgeIds.Contains(badgeId, StringComparer.OrdinalIgnoreCase);
    }

    private List<AchievementBadge> GetEnabledBadgeClones(UserAchievementProfile profile)
    {
        var defsById = GetActiveDefinitions()
            .ToDictionary(d => d.Id, d => d, StringComparer.OrdinalIgnoreCase);

        var result = new List<AchievementBadge>();
        foreach (var b in profile.Badges)
        {
            if (!IsBadgeEnabled(b.Id)) continue;

            var isSecret = defsById.TryGetValue(b.Id, out var def) && def.IsSecret;

            var clone = CloneBadge(b);

            if (isSecret && !clone.Unlocked)
            {
                clone.Title = "???";
                clone.Description = "Hidden achievement — keep watching to discover it.";
                clone.Icon = "help";
            }

            result.Add(clone);
        }
        return result;
    }

    private static int GetCurrentWatchStreak(UserAchievementCounters counters)
    {
        if (counters.WatchDates.Count == 0)
        {
            return 0;
        }

        var dates = counters.WatchDates
            .Select(d => DateOnly.TryParse(d, out var parsed) ? parsed : default)
            .Where(d => d != default)
            .OrderByDescending(d => d)
            .ToList();

        if (dates.Count == 0)
        {
            return 0;
        }

        var streak = 1;
        var current = dates[0];

        for (var i = 1; i < dates.Count; i++)
        {
            if (dates[i] == current.AddDays(-1))
            {
                streak++;
                current = dates[i];
            }
            else if (dates[i] == current)
            {
                continue;
            }
            else
            {
                break;
            }
        }

        return streak;
    }

    private void Load()
    {
        if (!File.Exists(_dataFilePath))
        {
            _userProfiles = new Dictionary<string, UserAchievementProfile>();
            _logger.LogInformation("No badge data file found, starting with empty store.");
            return;
        }

        try
        {
            var json = File.ReadAllText(_dataFilePath);
            var store = JsonSerializer.Deserialize<UserBadgeStore>(json, _jsonOptions);

            var rawProfiles = store?.UserProfiles ?? new Dictionary<string, UserAchievementProfile>();
            _userProfiles = new Dictionary<string, UserAchievementProfile>();
            var migrated = false;

            foreach (var pair in rawProfiles)
            {
                var canonicalKey = NormalizeUserId(pair.Key);
                var profile = pair.Value;
                profile.UserId = canonicalKey;

                if (_userProfiles.TryGetValue(canonicalKey, out var existing))
                {
                    _userProfiles[canonicalKey] = MergeProfiles(existing, profile);
                    migrated = true;
                }
                else
                {
                    _userProfiles[canonicalKey] = profile;
                }

                if (!string.Equals(pair.Key, canonicalKey, StringComparison.Ordinal))
                {
                    migrated = true;
                }
            }

            foreach (var profile in _userProfiles.Values)
            {
                SyncDefinitions(profile, profile.UserId);
                EvaluateBadges(profile, profile.UserId);
            }

            if (migrated)
            {
                _logger.LogInformation("Canonicalized achievement profile user keys.");
                Save();
            }

            _logger.LogInformation("Loaded achievement data for {UserCount} users.", _userProfiles.Count);
        }
        catch (Exception ex)
        {
            _userProfiles = new Dictionary<string, UserAchievementProfile>();
            _logger.LogError(ex, "Failed to load achievement data, starting with empty store.");
        }
    }

    private void Save()
    {
        var store = new UserBadgeStore
        {
            UserProfiles = _userProfiles
        };

        var json = JsonSerializer.Serialize(store, _jsonOptions);
        // Atomic write: serialize to .tmp then rename. Prevents JSON corruption
        // if the process is killed / machine loses power mid-write, which would
        // otherwise wipe every user's unlocked badges.
        var tmp = _dataFilePath + ".tmp";
        File.WriteAllText(tmp, json);
        File.Move(tmp, _dataFilePath, overwrite: true);
    }

    private static int CalendarDaysSinceFirstWatch(UserAchievementCounters c)
    {
        if (c.WatchDates.Count == 0) return 1;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly earliest = today;
        foreach (var d in c.WatchDates)
        {
            if (DateOnly.TryParse(d, out var parsed) && parsed < earliest)
                earliest = parsed;
        }
        return Math.Max(1, today.DayNumber - earliest.DayNumber);
    }

    private static AchievementBadge CreateBadgeFromDefinition(AchievementDefinition def, string userId)
    {
        return new AchievementBadge
        {
            Id = def.Id,
            UserId = userId,
            Key = def.Key,
            Title = def.Title,
            Description = def.Description,
            Icon = def.Icon,
            Category = def.Category,
            Unlocked = false,
            UnlockedAt = null,
            CurrentValue = 0,
            TargetValue = def.TargetValue,
            Rarity = def.Rarity
        };
    }

    private static AchievementBadge CloneBadge(AchievementBadge badge)
    {
        return new AchievementBadge
        {
            Id = badge.Id,
            UserId = badge.UserId,
            Key = badge.Key,
            Title = badge.Title,
            Description = badge.Description,
            Icon = badge.Icon,
            Category = badge.Category,
            Unlocked = badge.Unlocked,
            UnlockedAt = badge.UnlockedAt,
            CurrentValue = badge.CurrentValue,
            TargetValue = badge.TargetValue,
            Rarity = badge.Rarity
        };
    }
}