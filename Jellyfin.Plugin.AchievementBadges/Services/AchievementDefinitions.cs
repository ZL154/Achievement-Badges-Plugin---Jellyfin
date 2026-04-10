using System.Collections.Generic;
using Jellyfin.Plugin.AchievementBadges.Models;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public static class AchievementDefinitions
{
    public static IReadOnlyList<AchievementDefinition> All { get; } = new List<AchievementDefinition>
    {
        new() { Id = "first-contact", Key = "first_contact", Title = "First Contact", Description = "Watch your first item.", Icon = "play_circle", Category = "Getting Started", Rarity = "Common", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 1 },
        new() { Id = "media-explorer", Key = "media_explorer", Title = "Media Explorer", Description = "Watch 3 items.", Icon = "travel_explore", Category = "Getting Started", Rarity = "Common", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 3 },
        new() { Id = "getting-comfortable", Key = "getting_comfortable", Title = "Getting Comfortable", Description = "Watch 10 items.", Icon = "weekend", Category = "Getting Started", Rarity = "Common", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 10 },
        new() { Id = "settling-in", Key = "settling_in", Title = "Settling In", Description = "Watch 25 items.", Icon = "chair", Category = "Getting Started", Rarity = "Uncommon", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 25 },
        new() { Id = "jellyfin-resident", Key = "jellyfin_resident", Title = "Jellyfin Resident", Description = "Watch 50 items.", Icon = "home", Category = "Getting Started", Rarity = "Rare", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 50 },

        new() { Id = "binge-novice", Key = "binge_novice", Title = "Binge Novice", Description = "Watch 5 items.", Icon = "movie_filter", Category = "Binge", Rarity = "Common", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 5 },
        new() { Id = "binge-starter", Key = "binge_starter", Title = "Binge Starter", Description = "Watch 15 items.", Icon = "live_tv", Category = "Binge", Rarity = "Uncommon", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 15 },
        new() { Id = "binge-enjoyer", Key = "binge_enjoyer", Title = "Binge Enjoyer", Description = "Watch 30 items.", Icon = "theaters", Category = "Binge", Rarity = "Rare", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 30 },
        new() { Id = "binge-addict", Key = "binge_addict", Title = "Binge Addict", Description = "Watch 60 items.", Icon = "local_fire_department", Category = "Binge", Rarity = "Epic", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 60 },
        new() { Id = "binge-titan", Key = "binge_titan", Title = "Binge Titan", Description = "Watch 100 items.", Icon = "bolt", Category = "Binge", Rarity = "Legendary", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 100 },
        new() { Id = "binge-overlord", Key = "binge_overlord", Title = "Binge Overlord", Description = "Watch 250 items.", Icon = "military_tech", Category = "Binge", Rarity = "Legendary", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 250 },
        new() { Id = "binge-deity", Key = "binge_deity", Title = "Binge Deity", Description = "Watch 500 items.", Icon = "auto_awesome", Category = "Binge", Rarity = "Mythic", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 500 },

        new() { Id = "film-curious", Key = "film_curious", Title = "Film Curious", Description = "Watch 5 films.", Icon = "movie", Category = "Films", Rarity = "Common", Metric = AchievementMetric.MoviesWatched, TargetValue = 5 },
        new() { Id = "film-fan", Key = "film_fan", Title = "Film Fan", Description = "Watch 15 films.", Icon = "movie", Category = "Films", Rarity = "Uncommon", Metric = AchievementMetric.MoviesWatched, TargetValue = 15 },
        new() { Id = "film-enthusiast", Key = "film_enthusiast", Title = "Film Enthusiast", Description = "Watch 40 films.", Icon = "movie", Category = "Films", Rarity = "Rare", Metric = AchievementMetric.MoviesWatched, TargetValue = 40 },
        new() { Id = "film-buff", Key = "film_buff", Title = "Film Buff", Description = "Watch 80 films.", Icon = "movie", Category = "Films", Rarity = "Epic", Metric = AchievementMetric.MoviesWatched, TargetValue = 80 },
        new() { Id = "film-connoisseur", Key = "film_connoisseur", Title = "Film Connoisseur", Description = "Watch 150 films.", Icon = "movie", Category = "Films", Rarity = "Legendary", Metric = AchievementMetric.MoviesWatched, TargetValue = 150 },
        new() { Id = "cinema-historian", Key = "cinema_historian", Title = "Cinema Historian", Description = "Watch 300 films.", Icon = "movie", Category = "Films", Rarity = "Mythic", Metric = AchievementMetric.MoviesWatched, TargetValue = 300 },

        new() { Id = "series-starter", Key = "series_starter", Title = "Series Starter", Description = "Finish 1 series.", Icon = "tv", Category = "Series", Rarity = "Common", Metric = AchievementMetric.SeriesCompleted, TargetValue = 1 },
        new() { Id = "series-devotee", Key = "series_devotee", Title = "Series Devotee", Description = "Finish 5 series.", Icon = "tv", Category = "Series", Rarity = "Uncommon", Metric = AchievementMetric.SeriesCompleted, TargetValue = 5 },
        new() { Id = "series-veteran", Key = "series_veteran", Title = "Series Veteran", Description = "Finish 15 series.", Icon = "tv", Category = "Series", Rarity = "Rare", Metric = AchievementMetric.SeriesCompleted, TargetValue = 15 },
        new() { Id = "series-archivist", Key = "series_archivist", Title = "Series Archivist", Description = "Finish 30 series.", Icon = "tv", Category = "Series", Rarity = "Epic", Metric = AchievementMetric.SeriesCompleted, TargetValue = 30 },
        new() { Id = "series-master", Key = "series_master", Title = "Series Master", Description = "Finish 60 series.", Icon = "tv", Category = "Series", Rarity = "Legendary", Metric = AchievementMetric.SeriesCompleted, TargetValue = 60 },

        new() { Id = "night-owl", Key = "night_owl", Title = "Night Owl", Description = "Watch something late at night.", Icon = "dark_mode", Category = "Night Watching", Rarity = "Common", Metric = AchievementMetric.LateNightSessions, TargetValue = 1 },
        new() { Id = "midnight-wanderer", Key = "midnight_wanderer", Title = "Midnight Wanderer", Description = "Have 5 late-night sessions.", Icon = "nights_stay", Category = "Night Watching", Rarity = "Rare", Metric = AchievementMetric.LateNightSessions, TargetValue = 5 },
        new() { Id = "insomniac", Key = "insomniac", Title = "Insomniac", Description = "Have 20 late-night sessions.", Icon = "bedtime", Category = "Night Watching", Rarity = "Epic", Metric = AchievementMetric.LateNightSessions, TargetValue = 20 },
        new() { Id = "creature-of-the-night", Key = "creature_of_the_night", Title = "Creature of the Night", Description = "Have 50 late-night sessions.", Icon = "dark_mode", Category = "Night Watching", Rarity = "Legendary", Metric = AchievementMetric.LateNightSessions, TargetValue = 50 },

        new() { Id = "early-bird", Key = "early_bird", Title = "Early Bird", Description = "Watch something early in the morning.", Icon = "wb_sunny", Category = "Morning Watching", Rarity = "Common", Metric = AchievementMetric.EarlyMorningSessions, TargetValue = 1 },
        new() { Id = "morning-regular", Key = "morning_regular", Title = "Morning Regular", Description = "Have 10 early-morning sessions.", Icon = "light_mode", Category = "Morning Watching", Rarity = "Rare", Metric = AchievementMetric.EarlyMorningSessions, TargetValue = 10 },
        new() { Id = "sunrise-viewer", Key = "sunrise_viewer", Title = "Sunrise Viewer", Description = "Have 30 early-morning sessions.", Icon = "sunny", Category = "Morning Watching", Rarity = "Epic", Metric = AchievementMetric.EarlyMorningSessions, TargetValue = 30 },

        new() { Id = "weekend-warrior", Key = "weekend_warrior", Title = "Weekend Warrior", Description = "Watch something on a weekend.", Icon = "event", Category = "Weekend Watching", Rarity = "Common", Metric = AchievementMetric.WeekendSessions, TargetValue = 1 },
        new() { Id = "weekend-regular", Key = "weekend_regular", Title = "Weekend Regular", Description = "Have 10 weekend sessions.", Icon = "event_available", Category = "Weekend Watching", Rarity = "Rare", Metric = AchievementMetric.WeekendSessions, TargetValue = 10 },
        new() { Id = "weekend-champion", Key = "weekend_champion", Title = "Weekend Champion", Description = "Have 25 weekend sessions.", Icon = "celebration", Category = "Weekend Watching", Rarity = "Epic", Metric = AchievementMetric.WeekendSessions, TargetValue = 25 },
        new() { Id = "weekend-legend", Key = "weekend_legend", Title = "Weekend Legend", Description = "Have 60 weekend sessions.", Icon = "stars", Category = "Weekend Watching", Rarity = "Legendary", Metric = AchievementMetric.WeekendSessions, TargetValue = 60 },

        new() { Id = "explorer", Key = "explorer", Title = "Explorer", Description = "Watch from 3 different libraries.", Icon = "travel_explore", Category = "Exploration", Rarity = "Common", Metric = AchievementMetric.UniqueLibrariesVisited, TargetValue = 3 },
        new() { Id = "collector", Key = "collector", Title = "Collector", Description = "Watch from 5 different libraries.", Icon = "collections_bookmark", Category = "Exploration", Rarity = "Rare", Metric = AchievementMetric.UniqueLibrariesVisited, TargetValue = 5 },
        new() { Id = "archivist", Key = "archivist", Title = "Archivist", Description = "Watch from 10 different libraries.", Icon = "inventory_2", Category = "Exploration", Rarity = "Epic", Metric = AchievementMetric.UniqueLibrariesVisited, TargetValue = 10 },

        new() { Id = "daily-viewer", Key = "daily_viewer", Title = "Daily Viewer", Description = "Watch on 3 separate days.", Icon = "today", Category = "Streaks", Rarity = "Uncommon", Metric = AchievementMetric.DaysWatched, TargetValue = 3 },
        new() { Id = "routine-viewer", Key = "routine_viewer", Title = "Routine Viewer", Description = "Watch on 30 separate days.", Icon = "calendar_month", Category = "Streaks", Rarity = "Epic", Metric = AchievementMetric.DaysWatched, TargetValue = 30 },
        new() { Id = "jellyfin-loyalist", Key = "jellyfin_loyalist", Title = "Jellyfin Loyalist", Description = "Watch on 100 separate days.", Icon = "favorite", Category = "Streaks", Rarity = "Legendary", Metric = AchievementMetric.DaysWatched, TargetValue = 100 },

        new() { Id = "consistent-watcher", Key = "consistent_watcher", Title = "Consistent Watcher", Description = "Maintain a 7-day watch streak.", Icon = "timeline", Category = "Streaks", Rarity = "Rare", Metric = AchievementMetric.CurrentWatchStreak, TargetValue = 7 },
        new() { Id = "routine-machine", Key = "routine_machine", Title = "Routine Machine", Description = "Maintain a 30-day watch streak.", Icon = "insights", Category = "Streaks", Rarity = "Epic", Metric = AchievementMetric.CurrentWatchStreak, TargetValue = 30 },
        new() { Id = "unbroken", Key = "unbroken", Title = "Unbroken", Description = "Maintain a 100-day watch streak.", Icon = "all_inclusive", Category = "Streaks", Rarity = "Legendary", Metric = AchievementMetric.CurrentWatchStreak, TargetValue = 100 },

        new() { Id = "warmup", Key = "warmup", Title = "Warmup", Description = "Watch 2 episodes in a single day.", Icon = "speed", Category = "Episode Marathons", Rarity = "Common", Metric = AchievementMetric.MaxEpisodesInSingleDay, TargetValue = 2 },
        new() { Id = "cliffhanger-victim", Key = "cliffhanger_victim", Title = "Cliffhanger Victim", Description = "Watch 3 episodes in a single day.", Icon = "hourglass_bottom", Category = "Episode Marathons", Rarity = "Uncommon", Metric = AchievementMetric.MaxEpisodesInSingleDay, TargetValue = 3 },
        new() { Id = "episode-marathon", Key = "episode_marathon", Title = "Episode Marathon", Description = "Watch 5 episodes in a single day.", Icon = "directions_run", Category = "Episode Marathons", Rarity = "Rare", Metric = AchievementMetric.MaxEpisodesInSingleDay, TargetValue = 5 },
        new() { Id = "season-sprint", Key = "season_sprint", Title = "Season Sprint", Description = "Watch 10 episodes in a single day.", Icon = "sports_score", Category = "Episode Marathons", Rarity = "Epic", Metric = AchievementMetric.MaxEpisodesInSingleDay, TargetValue = 10 },

        new() { Id = "cinema-day", Key = "cinema_day", Title = "Cinema Day", Description = "Watch 3 films in a single day.", Icon = "local_movies", Category = "Film Marathons", Rarity = "Rare", Metric = AchievementMetric.MaxMoviesInSingleDay, TargetValue = 3 },
        new() { Id = "movie-marathon", Key = "movie_marathon", Title = "Movie Marathon", Description = "Watch 5 films in a single day.", Icon = "theaters", Category = "Film Marathons", Rarity = "Epic", Metric = AchievementMetric.MaxMoviesInSingleDay, TargetValue = 5 }
    };
}
