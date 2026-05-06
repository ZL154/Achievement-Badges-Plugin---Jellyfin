using System;
using System.Collections.Generic;
using System.Linq;

namespace Jellyfin.Plugin.AchievementBadges.Models;

public class UserAchievementCounters
{
    public int TotalItemsWatched { get; set; }
    public int MoviesWatched { get; set; }
    public int SeriesCompleted { get; set; }

    public int LateNightSessions { get; set; }
    public int EarlyMorningSessions { get; set; }
    public int WeekendSessions { get; set; }

    // v1.9.3 — fills the 12–17 (afternoon) and 19–22 (prime time) windows
    // that previously had no time-of-day badge surface.
    public int AfternoonSessions { get; set; }
    public int PrimeTimeSessions { get; set; }

    public HashSet<string> LibrariesVisited { get; set; } = new();

    public HashSet<string> WatchDates { get; set; } = new();

    public Dictionary<string, int> MoviesByDate { get; set; } = new();
    public Dictionary<string, int> EpisodesByDate { get; set; } = new();

    public DateOnly? LastWatchDate { get; set; }

    public int BestWatchStreak { get; set; }

    public HashSet<int> DecadesWatched { get; set; } = new();
    public HashSet<string> CountriesWatched { get; set; } = new();
    public HashSet<string> LanguagesWatched { get; set; } = new();
    public HashSet<string> GenresWatched { get; set; } = new();

    public long TotalMinutesWatched { get; set; }
    public int LongestItemMinutes { get; set; }
    public int ShortItemsWatched { get; set; }

    public bool WatchedOnChristmas { get; set; }
    public bool WatchedOnNewYear { get; set; }
    public bool WatchedOnHalloween { get; set; }
    public bool WatchedOnEid { get; set; }

    // v1.9.3 — Holiday expansion. One-shot booleans like the existing four.
    public bool WatchedOnValentines { get; set; }
    public bool WatchedOnEaster { get; set; }
    public bool WatchedOnLunarNewYear { get; set; }
    public bool WatchedOnDiwali { get; set; }
    public bool WatchedOnThanksgiving { get; set; }
    public bool WatchedOnIndependenceDayUS { get; set; }
    public bool WatchedOnBonfireNight { get; set; }
    public bool WatchedOnBoxingDay { get; set; }
    public bool WatchedOnMothersDay { get; set; }
    public bool WatchedOnFathersDay { get; set; }

    // v1.9.3 — Anime detection (genre/tag contains "anime" — same heuristic
    // as the StarTrack plugin's anime tab classifier).
    public int AnimeItemsWatched { get; set; }

    // v1.9.3 — Studio specialists. Mirrors GenreItemCounts: keyed by
    // studio name, value = number of finished items credited to that studio.
    public Dictionary<string, int> StudioItemCounts { get; set; } = new();

    // v1.9.3 — Per-series pilot tracking. SeriesPilotsWatched holds the set
    // of series IDs whose S1E1 has been watched. SeriesContinuedPastPilot
    // adds the series ID once any episode AFTER S1E1 (same series, different
    // index) is watched, so a user is counted in both sets simultaneously
    // when they bingewatch.
    public HashSet<string> SeriesPilotsWatched { get; set; } = new();
    public HashSet<string> SeriesContinuedPastPilot { get; set; } = new();

    public int LongSeriesCompleted { get; set; }
    public int VeryLongSeriesCompleted { get; set; }

    public int RewatchCount { get; set; }

    public Dictionary<string, int> GenreItemCounts { get; set; } = new();
    public Dictionary<string, int> DirectorItemCounts { get; set; } = new();
    public Dictionary<string, int> ActorItemCounts { get; set; } = new();
    public Dictionary<string, int> LibraryItemCounts { get; set; } = new();
    public Dictionary<string, int> LibraryCompletionPercents { get; set; } = new();

    // Per-decade item counts (key = decade as string, e.g. "1970", "1980")
    public Dictionary<string, int> DecadeItemCounts { get; set; } = new();
    // Per-day-of-week item counts (key = day name, e.g. "Monday")
    public Dictionary<string, int> DayOfWeekItemCounts { get; set; } = new();
    // Per-day total minutes watched (key = date yyyy-MM-dd)
    public Dictionary<string, int> MinutesByDate { get; set; } = new();

    public HashSet<string> LoginDates { get; set; } = new();
    public DateOnly? LastLoginDate { get; set; }
    public int BestLoginStreak { get; set; }

    public int MaxEpisodesInSingleDay
    {
        get
        {
            return EpisodesByDate.Count == 0 ? 0 : EpisodesByDate.Values.Max();
        }
    }

    public int MaxMoviesInSingleDay
    {
        get
        {
            return MoviesByDate.Count == 0 ? 0 : MoviesByDate.Values.Max();
        }
    }

    public int UniqueLibrariesVisited
    {
        get
        {
            return LibrariesVisited.Count;
        }
    }

    public int DaysWatched
    {
        get
        {
            return WatchDates.Count;
        }
    }

    public int UniqueDecadesWatched => DecadesWatched.Count;
    public int UniqueCountriesWatched => CountriesWatched.Count;
    public int UniqueLanguagesWatched => LanguagesWatched.Count;
    public int UniqueGenresWatched => GenresWatched.Count;

    public int DaysLoggedIn => LoginDates.Count;

    public int CurrentLoginStreak
    {
        get
        {
            if (LoginDates.Count == 0) return 0;
            var dates = LoginDates
                .Select(d => DateOnly.TryParse(d, out var parsed) ? parsed : default)
                .Where(d => d != default)
                .OrderByDescending(d => d)
                .ToList();
            if (dates.Count == 0) return 0;

            var streak = 1;
            var current = dates[0];
            for (var i = 1; i < dates.Count; i++)
            {
                if (dates[i] == current.AddDays(-1)) { streak++; current = dates[i]; }
                else if (dates[i] == current) continue;
                else break;
            }
            return streak;
        }
    }

    public int TopDirectorCount => DirectorItemCounts.Count == 0 ? 0 : DirectorItemCounts.Values.Max();
    public int TopActorCount => ActorItemCounts.Count == 0 ? 0 : ActorItemCounts.Values.Max();

    // v1.9.3 — derived pilot-vs-completer metrics. SeriesSampledOnly counts
    // series where S1E1 was watched but no other episode followed. Bingers
    // sit in SeriesContinuedPastPilot.
    public int SeriesSampledOnlyCount => SeriesPilotsWatched.Count(id => !SeriesContinuedPastPilot.Contains(id));
    public int SeriesBingedAfterPilotCount => SeriesContinuedPastPilot.Count;
    public int BestLibraryCompletionPercent => LibraryCompletionPercents.Count == 0 ? 0 : LibraryCompletionPercents.Values.Max();
    public int LibrariesAt100PercentCount => LibraryCompletionPercents.Count(kv => kv.Value >= 100);
    public int MaxLibraryItemCountValue => LibraryItemCounts.Count == 0 ? 0 : LibraryItemCounts.Values.Max();
    public int MaxMinutesInSingleDay => MinutesByDate.Count == 0 ? 0 : MinutesByDate.Values.Max();
}
