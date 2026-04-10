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

    public HashSet<string> LibrariesVisited { get; set; } = new();

    public HashSet<string> WatchDates { get; set; } = new();

    public Dictionary<string, int> MoviesByDate { get; set; } = new();
    public Dictionary<string, int> EpisodesByDate { get; set; } = new();

    public DateOnly? LastWatchDate { get; set; }

    public int BestWatchStreak { get; set; }

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
}