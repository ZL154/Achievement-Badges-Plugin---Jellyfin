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

        new() { Id = "double-feature", Key = "double_feature", Title = "Double Feature", Description = "Watch 2 films in a single day.", Icon = "local_movies", Category = "Film Marathons", Rarity = "Common", Metric = AchievementMetric.MaxMoviesInSingleDay, TargetValue = 2 },
        new() { Id = "cinema-day", Key = "cinema_day", Title = "Cinema Day", Description = "Watch 3 films in a single day.", Icon = "local_movies", Category = "Film Marathons", Rarity = "Rare", Metric = AchievementMetric.MaxMoviesInSingleDay, TargetValue = 3 },
        new() { Id = "movie-marathon", Key = "movie_marathon", Title = "Movie Marathon", Description = "Watch 5 films in a single day.", Icon = "theaters", Category = "Film Marathons", Rarity = "Epic", Metric = AchievementMetric.MaxMoviesInSingleDay, TargetValue = 5 },
        new() { Id = "film-festival", Key = "film_festival", Title = "Film Festival", Description = "Watch 7 films in a single day.", Icon = "festival", Category = "Film Marathons", Rarity = "Mythic", Metric = AchievementMetric.MaxMoviesInSingleDay, TargetValue = 7 },

        new() { Id = "season-devourer", Key = "season_devourer", Title = "Season Devourer", Description = "Watch 20 episodes in a single day.", Icon = "fastfood", Category = "Episode Marathons", Rarity = "Legendary", Metric = AchievementMetric.MaxEpisodesInSingleDay, TargetValue = 20 },
        new() { Id = "all-nighter", Key = "all_nighter", Title = "All-Nighter", Description = "Watch 30 episodes in a single day.", Icon = "alarm", Category = "Episode Marathons", Rarity = "Mythic", Metric = AchievementMetric.MaxEpisodesInSingleDay, TargetValue = 30 },

        new() { Id = "half-century-films", Key = "half_century_films", Title = "Half-Century", Description = "Watch 50 films.", Icon = "movie", Category = "Films", Rarity = "Rare", Metric = AchievementMetric.MoviesWatched, TargetValue = 50 },

        new() { Id = "millennium", Key = "millennium", Title = "Millennium", Description = "Watch 1000 items.", Icon = "rocket_launch", Category = "Binge", Rarity = "Mythic", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 1000 },

        new() { Id = "three-am-club", Key = "three_am_club", Title = "3 AM Club", Description = "Have 100 late-night sessions.", Icon = "nightlight", Category = "Night Watching", Rarity = "Mythic", Metric = AchievementMetric.LateNightSessions, TargetValue = 100 },

        new() { Id = "dawn-patrol", Key = "dawn_patrol", Title = "Dawn Patrol", Description = "Have 50 early-morning sessions.", Icon = "brightness_5", Category = "Morning Watching", Rarity = "Legendary", Metric = AchievementMetric.EarlyMorningSessions, TargetValue = 50 },

        new() { Id = "saturday-night-fever", Key = "saturday_night_fever", Title = "Saturday Night Fever", Description = "Have 100 weekend sessions.", Icon = "local_fire_department", Category = "Weekend Watching", Rarity = "Mythic", Metric = AchievementMetric.WeekendSessions, TargetValue = 100 },

        new() { Id = "momentum", Key = "momentum", Title = "Momentum", Description = "Reach a best watch streak of 3 days.", Icon = "trending_up", Category = "Best Streaks", Rarity = "Common", Metric = AchievementMetric.BestWatchStreak, TargetValue = 3 },
        new() { Id = "fortnight", Key = "fortnight", Title = "Fortnight", Description = "Reach a best watch streak of 14 days.", Icon = "calendar_view_week", Category = "Best Streaks", Rarity = "Epic", Metric = AchievementMetric.BestWatchStreak, TargetValue = 14 },
        new() { Id = "marathon-man", Key = "marathon_man", Title = "Marathon Man", Description = "Reach a best watch streak of 60 days.", Icon = "directions_run", Category = "Best Streaks", Rarity = "Legendary", Metric = AchievementMetric.BestWatchStreak, TargetValue = 60 },

        new() { Id = "time-traveller-novice", Key = "time_traveller_novice", Title = "Time Traveller", Description = "Watch items from 3 different decades.", Icon = "schedule", Category = "Eras", Rarity = "Uncommon", Metric = AchievementMetric.UniqueDecadesWatched, TargetValue = 3 },
        new() { Id = "time-traveller", Key = "time_traveller", Title = "Era Hopper", Description = "Watch items from 5 different decades.", Icon = "history", Category = "Eras", Rarity = "Rare", Metric = AchievementMetric.UniqueDecadesWatched, TargetValue = 5 },
        new() { Id = "epoch-explorer", Key = "epoch_explorer", Title = "Epoch Explorer", Description = "Watch items from 8 different decades.", Icon = "hourglass_full", Category = "Eras", Rarity = "Legendary", Metric = AchievementMetric.UniqueDecadesWatched, TargetValue = 8 },

        new() { Id = "globetrotter", Key = "globetrotter", Title = "Globetrotter", Description = "Watch items produced in 3 different countries.", Icon = "public", Category = "World", Rarity = "Uncommon", Metric = AchievementMetric.UniqueCountriesWatched, TargetValue = 3 },
        new() { Id = "world-tour", Key = "world_tour", Title = "World Tour", Description = "Watch items produced in 5 different countries.", Icon = "flight_takeoff", Category = "World", Rarity = "Rare", Metric = AchievementMetric.UniqueCountriesWatched, TargetValue = 5 },
        new() { Id = "un-delegate", Key = "un_delegate", Title = "UN Delegate", Description = "Watch items produced in 10 different countries.", Icon = "language", Category = "World", Rarity = "Epic", Metric = AchievementMetric.UniqueCountriesWatched, TargetValue = 10 },

        new() { Id = "bilingual", Key = "bilingual", Title = "Bilingual", Description = "Watch items in 2 different original languages.", Icon = "translate", Category = "Languages", Rarity = "Common", Metric = AchievementMetric.UniqueLanguagesWatched, TargetValue = 2 },
        new() { Id = "polyglot", Key = "polyglot", Title = "Polyglot", Description = "Watch items in 5 different original languages.", Icon = "record_voice_over", Category = "Languages", Rarity = "Epic", Metric = AchievementMetric.UniqueLanguagesWatched, TargetValue = 5 },

        new() { Id = "genre-curious", Key = "genre_curious", Title = "Genre Curious", Description = "Watch items across 3 different genres.", Icon = "category", Category = "Genres", Rarity = "Common", Metric = AchievementMetric.UniqueGenresWatched, TargetValue = 3 },
        new() { Id = "genre-hopper", Key = "genre_hopper", Title = "Genre Hopper", Description = "Watch items across 5 different genres.", Icon = "swap_horiz", Category = "Genres", Rarity = "Rare", Metric = AchievementMetric.UniqueGenresWatched, TargetValue = 5 },
        new() { Id = "genre-master", Key = "genre_master", Title = "Genre Master", Description = "Watch items across 10 different genres.", Icon = "auto_awesome_motion", Category = "Genres", Rarity = "Epic", Metric = AchievementMetric.UniqueGenresWatched, TargetValue = 10 },

        new() { Id = "epic-runtime", Key = "epic_runtime", Title = "Epic Runtime", Description = "Watch a single item over 3 hours long.", Icon = "timer", Category = "Runtime", Rarity = "Rare", Metric = AchievementMetric.LongestItemMinutes, TargetValue = 180 },
        new() { Id = "saga-runtime", Key = "saga_runtime", Title = "Saga Runtime", Description = "Watch a single item over 4 hours long.", Icon = "movie_creation", Category = "Runtime", Rarity = "Legendary", Metric = AchievementMetric.LongestItemMinutes, TargetValue = 240 },

        new() { Id = "short-attention-span", Key = "short_attention_span", Title = "Short Attention Span", Description = "Watch 20 items under 30 minutes each.", Icon = "bolt", Category = "Runtime", Rarity = "Uncommon", Metric = AchievementMetric.ShortItemsWatched, TargetValue = 20 },

        new() { Id = "ten-hours", Key = "ten_hours", Title = "Ten Hours", Description = "Watch 10 hours of content.", Icon = "schedule", Category = "Total Time", Rarity = "Common", Metric = AchievementMetric.TotalMinutesWatched, TargetValue = 600 },
        new() { Id = "hundred-hours", Key = "hundred_hours", Title = "Hundred Hours", Description = "Watch 100 hours of content.", Icon = "hourglass_top", Category = "Total Time", Rarity = "Rare", Metric = AchievementMetric.TotalMinutesWatched, TargetValue = 6000 },
        new() { Id = "five-hundred-hours", Key = "five_hundred_hours", Title = "500 Hour Club", Description = "Watch 500 hours of content.", Icon = "update", Category = "Total Time", Rarity = "Epic", Metric = AchievementMetric.TotalMinutesWatched, TargetValue = 30000 },
        new() { Id = "thousand-hours", Key = "thousand_hours", Title = "Thousand Hours", Description = "Watch 1000 hours of content.", Icon = "av_timer", Category = "Total Time", Rarity = "Legendary", Metric = AchievementMetric.TotalMinutesWatched, TargetValue = 60000 },

        new() { Id = "christmas-cheer", Key = "christmas_cheer", Title = "Christmas Cheer", Description = "Watch something on Christmas Day.", Icon = "celebration", Category = "Holidays", Rarity = "Rare", Metric = AchievementMetric.WatchedOnChristmas, TargetValue = 1 },
        new() { Id = "new-years-marathon", Key = "new_years_marathon", Title = "New Year's Marathon", Description = "Watch something on New Year's Day.", Icon = "cake", Category = "Holidays", Rarity = "Rare", Metric = AchievementMetric.WatchedOnNewYear, TargetValue = 1 },
        new() { Id = "halloween-horror", Key = "halloween_horror", Title = "Halloween Night", Description = "Watch something on Halloween.", Icon = "whatshot", Category = "Holidays", Rarity = "Rare", Metric = AchievementMetric.WatchedOnHalloween, TargetValue = 1 },
        new() { Id = "eid-mubarak", Key = "eid_mubarak", Title = "Eid Mubarak", Description = "Watch something during Eid al-Fitr or Eid al-Adha.", Icon = "public", Category = "Holidays", Rarity = "Rare", Metric = AchievementMetric.WatchedOnEid, TargetValue = 1 },

        new() { Id = "completionist-plus", Key = "completionist_plus", Title = "Completionist+", Description = "Complete a series with 50 or more episodes.", Icon = "military_tech", Category = "Series", Rarity = "Epic", Metric = AchievementMetric.LongSeriesCompleted, TargetValue = 1 },
        new() { Id = "seen-it-all", Key = "seen_it_all", Title = "Seen It All", Description = "Complete a series with 100 or more episodes.", Icon = "workspace_premium", Category = "Series", Rarity = "Legendary", Metric = AchievementMetric.VeryLongSeriesCompleted, TargetValue = 1 },

        new() { Id = "rewatcher", Key = "rewatcher", Title = "Rewatcher", Description = "Rewatch 5 items.", Icon = "replay", Category = "Rewatch", Rarity = "Uncommon", Metric = AchievementMetric.RewatchCount, TargetValue = 5 },
        new() { Id = "serial-rewatcher", Key = "serial_rewatcher", Title = "Serial Rewatcher", Description = "Rewatch 25 items.", Icon = "repeat", Category = "Rewatch", Rarity = "Epic", Metric = AchievementMetric.RewatchCount, TargetValue = 25 },

        new() { Id = "library-explorer", Key = "library_explorer", Title = "Library Explorer", Description = "Reach 10% completion in any library.", Icon = "library_books", Category = "Library Completion", Rarity = "Common", Metric = AchievementMetric.LibraryCompletionPercent, TargetValue = 10 },
        new() { Id = "library-quarter", Key = "library_quarter", Title = "Quarter Complete", Description = "Reach 25% completion in any library.", Icon = "menu_book", Category = "Library Completion", Rarity = "Uncommon", Metric = AchievementMetric.LibraryCompletionPercent, TargetValue = 25 },
        new() { Id = "library-half", Key = "library_half", Title = "Halfway There", Description = "Reach 50% completion in any library.", Icon = "auto_stories", Category = "Library Completion", Rarity = "Rare", Metric = AchievementMetric.LibraryCompletionPercent, TargetValue = 50 },
        new() { Id = "library-three-quarter", Key = "library_three_quarter", Title = "Three-Quarters", Description = "Reach 75% completion in any library.", Icon = "menu_book", Category = "Library Completion", Rarity = "Epic", Metric = AchievementMetric.LibraryCompletionPercent, TargetValue = 75 },
        new() { Id = "library-complete", Key = "library_complete", Title = "100% Complete", Description = "Reach 100% completion in any library.", Icon = "check_circle", Category = "Library Completion", Rarity = "Legendary", Metric = AchievementMetric.LibraryCompletionPercent, TargetValue = 100 },

        new() { Id = "login-streak-week", Key = "login_streak_week", Title = "Regular Visitor", Description = "Log in 7 different days.", Icon = "event_repeat", Category = "Loyalty", Rarity = "Common", Metric = AchievementMetric.DaysLoggedIn, TargetValue = 7 },
        new() { Id = "login-streak-month", Key = "login_streak_month", Title = "Monthly Regular", Description = "Log in 30 different days.", Icon = "calendar_month", Category = "Loyalty", Rarity = "Rare", Metric = AchievementMetric.DaysLoggedIn, TargetValue = 30 },
        new() { Id = "login-streak-year", Key = "login_streak_year", Title = "Dedicated", Description = "Log in 365 different days.", Icon = "workspace_premium", Category = "Loyalty", Rarity = "Legendary", Metric = AchievementMetric.DaysLoggedIn, TargetValue = 365 },
        new() { Id = "login-current-week", Key = "login_current_week", Title = "Here Every Day", Description = "Log in 7 days in a row.", Icon = "date_range", Category = "Loyalty", Rarity = "Uncommon", Metric = AchievementMetric.CurrentLoginStreak, TargetValue = 7 },

        new() { Id = "director-fan", Key = "director_fan", Title = "Director Fan", Description = "Watch 5 items from the same director.", Icon = "videocam", Category = "People", Rarity = "Uncommon", Metric = AchievementMetric.TopDirectorCount, TargetValue = 5 },
        new() { Id = "director-enthusiast", Key = "director_enthusiast", Title = "Director Enthusiast", Description = "Watch 10 items from the same director.", Icon = "movie_creation", Category = "People", Rarity = "Rare", Metric = AchievementMetric.TopDirectorCount, TargetValue = 10 },
        new() { Id = "auteur-disciple", Key = "auteur_disciple", Title = "Auteur Disciple", Description = "Watch 20 items from the same director.", Icon = "award_star", Category = "People", Rarity = "Epic", Metric = AchievementMetric.TopDirectorCount, TargetValue = 20 },
        new() { Id = "actor-fan", Key = "actor_fan", Title = "Actor Fan", Description = "Watch 10 items featuring the same actor.", Icon = "face", Category = "People", Rarity = "Uncommon", Metric = AchievementMetric.TopActorCount, TargetValue = 10 },
        new() { Id = "actor-superfan", Key = "actor_superfan", Title = "Actor Superfan", Description = "Watch 25 items featuring the same actor.", Icon = "theater_comedy", Category = "People", Rarity = "Rare", Metric = AchievementMetric.TopActorCount, TargetValue = 25 },
        new() { Id = "actor-stan", Key = "actor_stan", Title = "Biggest Stan", Description = "Watch 50 items featuring the same actor.", Icon = "stars", Category = "People", Rarity = "Legendary", Metric = AchievementMetric.TopActorCount, TargetValue = 50 },

        new() { Id = "hidden-night-shift", Key = "hidden_night_shift", Title = "Night Shift", Description = "Have 15 late-night sessions.", Icon = "dark_mode", Category = "Hidden", Rarity = "Rare", Metric = AchievementMetric.LateNightSessions, TargetValue = 15, IsSecret = true },
        new() { Id = "hidden-obsessed", Key = "hidden_obsessed", Title = "Obsessed", Description = "Rewatch 50 items.", Icon = "psychology", Category = "Hidden", Rarity = "Epic", Metric = AchievementMetric.RewatchCount, TargetValue = 50, IsSecret = true },
        new() { Id = "hidden-speedrunner", Key = "hidden_speedrunner", Title = "Speedrunner", Description = "Watch 15 episodes in a single day.", Icon = "speed", Category = "Hidden", Rarity = "Rare", Metric = AchievementMetric.MaxEpisodesInSingleDay, TargetValue = 15, IsSecret = true },
        new() { Id = "hidden-polyglot", Key = "hidden_polyglot", Title = "True Polyglot", Description = "Watch items in 8 different languages.", Icon = "translate", Category = "Hidden", Rarity = "Legendary", Metric = AchievementMetric.UniqueLanguagesWatched, TargetValue = 8, IsSecret = true },
        new() { Id = "hidden-completionist", Key = "hidden_completionist", Title = "Completionist Supreme", Description = "Hit 100% in a library.", Icon = "verified", Category = "Hidden", Rarity = "Mythic", Metric = AchievementMetric.LibraryCompletionPercent, TargetValue = 100, IsSecret = true },
        new() { Id = "hidden-loyal", Key = "hidden_loyal", Title = "Never Misses", Description = "Log in 14 days in a row.", Icon = "favorite", Category = "Hidden", Rarity = "Rare", Metric = AchievementMetric.CurrentLoginStreak, TargetValue = 14, IsSecret = true },

        // Genre specialists (use existing GenreItemsWatched metric with a parameter)
        new() { Id = "genre-horror", Key = "genre_horror", Title = "Horror Aficionado", Description = "Watch 30 horror items.", Icon = "whatshot", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Horror", TargetValue = 30 },
        new() { Id = "genre-comedy", Key = "genre_comedy", Title = "Comedy King", Description = "Watch 30 comedy items.", Icon = "mood", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Comedy", TargetValue = 30 },
        new() { Id = "genre-drama", Key = "genre_drama", Title = "Drama Devotee", Description = "Watch 30 drama items.", Icon = "theater_comedy", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Drama", TargetValue = 30 },
        new() { Id = "genre-action", Key = "genre_action", Title = "Action Hero", Description = "Watch 30 action items.", Icon = "sports_martial_arts", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Action", TargetValue = 30 },
        new() { Id = "genre-scifi", Key = "genre_scifi", Title = "Sci-Fi Scholar", Description = "Watch 30 sci-fi items.", Icon = "rocket_launch", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Science Fiction", TargetValue = 30 },
        new() { Id = "genre-animation", Key = "genre_animation", Title = "Animation Enthusiast", Description = "Watch 30 animated items.", Icon = "draw", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Animation", TargetValue = 30 },
        new() { Id = "genre-documentary", Key = "genre_documentary", Title = "Documentary Deep Dive", Description = "Watch 20 documentaries.", Icon = "science", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Documentary", TargetValue = 20 },
        new() { Id = "genre-crime", Key = "genre_crime", Title = "Crime Casefile", Description = "Watch 30 crime items.", Icon = "gavel", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Crime", TargetValue = 30 },
        new() { Id = "genre-romance", Key = "genre_romance", Title = "Romance Rewind", Description = "Watch 20 romance items.", Icon = "favorite", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Romance", TargetValue = 20 },
        new() { Id = "genre-thriller", Key = "genre_thriller", Title = "Thriller Thrills", Description = "Watch 30 thrillers.", Icon = "bolt", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Thriller", TargetValue = 30 },
        new() { Id = "genre-fantasy", Key = "genre_fantasy", Title = "Fantasy Forever", Description = "Watch 30 fantasy items.", Icon = "auto_fix_high", Category = "Genre Specialist", Rarity = "Rare", Metric = AchievementMetric.GenreItemsWatched, MetricParameter = "Fantasy", TargetValue = 30 },

        // Streak extremes
        new() { Id = "streak-200", Key = "streak_200", Title = "Unstoppable", Description = "Reach a best watch streak of 200 days.", Icon = "trending_up", Category = "Best Streaks", Rarity = "Mythic", Metric = AchievementMetric.BestWatchStreak, TargetValue = 200 },
        new() { Id = "streak-365", Key = "streak_365", Title = "Year-Long", Description = "Reach a best watch streak of 365 days.", Icon = "event", Category = "Best Streaks", Rarity = "Mythic", Metric = AchievementMetric.BestWatchStreak, TargetValue = 365 },
        new() { Id = "streak-500", Key = "streak_500", Title = "Impossible", Description = "Reach a best watch streak of 500 days.", Icon = "auto_awesome", Category = "Best Streaks", Rarity = "Mythic", Metric = AchievementMetric.BestWatchStreak, TargetValue = 500 },

        // Late night extremes
        new() { Id = "late-graveyard", Key = "late_graveyard", Title = "Graveyard Shift", Description = "Have 500 late-night sessions.", Icon = "nightlife", Category = "Night Watching", Rarity = "Mythic", Metric = AchievementMetric.LateNightSessions, TargetValue = 500 },
        new() { Id = "late-vampire", Key = "late_vampire", Title = "Vampire", Description = "Have 1000 late-night sessions.", Icon = "dark_mode", Category = "Night Watching", Rarity = "Mythic", Metric = AchievementMetric.LateNightSessions, TargetValue = 1000 },

        // Rewatch extremes
        new() { Id = "rewatch-serial", Key = "rewatch_serial", Title = "Serial Offender", Description = "Rewatch 100 items.", Icon = "repeat_on", Category = "Rewatch", Rarity = "Legendary", Metric = AchievementMetric.RewatchCount, TargetValue = 100 },
        new() { Id = "rewatch-comfort", Key = "rewatch_comfort", Title = "Comfort Zone", Description = "Rewatch 500 items.", Icon = "replay_circle_filled", Category = "Rewatch", Rarity = "Mythic", Metric = AchievementMetric.RewatchCount, TargetValue = 500 },

        // Total time extremes
        new() { Id = "time-2k", Key = "time_2k", Title = "Two Thousand Hours", Description = "Watch 2000 hours of content.", Icon = "update", Category = "Total Time", Rarity = "Mythic", Metric = AchievementMetric.TotalMinutesWatched, TargetValue = 120000 },
        new() { Id = "time-5k", Key = "time_5k", Title = "Five Thousand Hours", Description = "Watch 5000 hours of content.", Icon = "av_timer", Category = "Total Time", Rarity = "Mythic", Metric = AchievementMetric.TotalMinutesWatched, TargetValue = 300000 },

        // Days watched extreme
        new() { Id = "days-year-rounder", Key = "days_year_rounder", Title = "Year Rounder", Description = "Watch on 365 separate days.", Icon = "calendar_today", Category = "Streaks", Rarity = "Mythic", Metric = AchievementMetric.DaysWatched, TargetValue = 365 },

        // Prestige tier badges (new PrestigeLevel metric)
        new() { Id = "prestige-1", Key = "prestige_1", Title = "First Prestige", Description = "Reach prestige level 1.", Icon = "auto_awesome", Category = "Prestige", Rarity = "Legendary", Metric = AchievementMetric.PrestigeLevel, TargetValue = 1 },
        new() { Id = "prestige-3", Key = "prestige_3", Title = "Triple Crown", Description = "Reach prestige level 3.", Icon = "workspace_premium", Category = "Prestige", Rarity = "Mythic", Metric = AchievementMetric.PrestigeLevel, TargetValue = 3 },
        new() { Id = "prestige-5", Key = "prestige_5", Title = "Pentaprestige", Description = "Reach prestige level 5.", Icon = "military_tech", Category = "Prestige", Rarity = "Mythic", Metric = AchievementMetric.PrestigeLevel, TargetValue = 5 },
        new() { Id = "prestige-10", Key = "prestige_10", Title = "Legend of Legends", Description = "Reach prestige level 10.", Icon = "stars", Category = "Prestige", Rarity = "Mythic", Metric = AchievementMetric.PrestigeLevel, TargetValue = 10 },
        new() { Id = "prestige-15", Key = "prestige_15", Title = "Prestige Elite", Description = "Reach prestige level 15.", Icon = "workspace_premium", Category = "Prestige", Rarity = "Mythic", Metric = AchievementMetric.PrestigeLevel, TargetValue = 15 },
        new() { Id = "prestige-25", Key = "prestige_25", Title = "Prestige Icon", Description = "Reach prestige level 25.", Icon = "military_tech", Category = "Prestige", Rarity = "Mythic", Metric = AchievementMetric.PrestigeLevel, TargetValue = 25 },
        new() { Id = "prestige-50", Key = "prestige_50", Title = "Prestige God", Description = "Reach prestige level 50.", Icon = "auto_awesome", Category = "Prestige", Rarity = "Mythic", Metric = AchievementMetric.PrestigeLevel, TargetValue = 50 },

        // Score Millionaire (lifetime score)
        new() { Id = "score-500k", Key = "score_500k", Title = "Half Millionaire", Description = "Earn 500,000 lifetime score.", Icon = "paid", Category = "Score Economy", Rarity = "Legendary", Metric = AchievementMetric.LifetimeScore, TargetValue = 500000 },
        new() { Id = "score-1m", Key = "score_1m", Title = "Score Millionaire", Description = "Earn 1,000,000 lifetime score.", Icon = "diamond", Category = "Score Economy", Rarity = "Mythic", Metric = AchievementMetric.LifetimeScore, TargetValue = 1000000 },

        // Morning Ritual extremes
        new() { Id = "morning-ritual-100", Key = "morning_ritual_100", Title = "Morning Ritual", Description = "Have 100 early-morning sessions.", Icon = "wb_twilight", Category = "Morning Watching", Rarity = "Legendary", Metric = AchievementMetric.EarlyMorningSessions, TargetValue = 100 },
        new() { Id = "morning-ritual-500", Key = "morning_ritual_500", Title = "Dawn Watcher", Description = "Have 500 early-morning sessions.", Icon = "wb_sunny", Category = "Morning Watching", Rarity = "Mythic", Metric = AchievementMetric.EarlyMorningSessions, TargetValue = 500 },

        // Combo Master
        new() { Id = "combo-master-15", Key = "combo_master_15", Title = "Combo Master", Description = "Reach a 15x playback combo.", Icon = "flash_on", Category = "Combos", Rarity = "Epic", Metric = AchievementMetric.BestComboCount, TargetValue = 15 },
        new() { Id = "combo-master-30", Key = "combo_master_30", Title = "Combo God", Description = "Reach a 30x playback combo.", Icon = "bolt", Category = "Combos", Rarity = "Mythic", Metric = AchievementMetric.BestComboCount, TargetValue = 30 },

        // Library Completionist
        new() { Id = "lib-complete-1", Key = "lib_complete_1", Title = "One Library Down", Description = "Reach 100% completion in 1 library.", Icon = "check_circle", Category = "Library Completion", Rarity = "Epic", Metric = AchievementMetric.LibrariesAt100Percent, TargetValue = 1 },
        new() { Id = "lib-complete-3", Key = "lib_complete_3", Title = "Triple Completionist", Description = "Reach 100% completion in 3 libraries.", Icon = "verified", Category = "Library Completion", Rarity = "Mythic", Metric = AchievementMetric.LibrariesAt100Percent, TargetValue = 3 },

        // Badge Hoarder
        new() { Id = "badges-50pct", Key = "badges_50pct", Title = "Badge Collector", Description = "Unlock 50% of all badges.", Icon = "emoji_events", Category = "Meta", Rarity = "Legendary", Metric = AchievementMetric.BadgesUnlockedPercent, TargetValue = 50 },
        new() { Id = "badges-75pct", Key = "badges_75pct", Title = "Badge Hoarder", Description = "Unlock 75% of all badges.", Icon = "emoji_events", Category = "Meta", Rarity = "Mythic", Metric = AchievementMetric.BadgesUnlockedPercent, TargetValue = 75 },

        // Director Devotee extremes
        new() { Id = "director-devotee-50", Key = "director_devotee_50", Title = "Director Devotee", Description = "Watch 50 items from the same director.", Icon = "theaters", Category = "People", Rarity = "Legendary", Metric = AchievementMetric.TopDirectorCount, TargetValue = 50 },
        new() { Id = "director-devotee-100", Key = "director_devotee_100", Title = "Filmmaker Scholar", Description = "Watch 100 items from the same director.", Icon = "movie_creation", Category = "People", Rarity = "Mythic", Metric = AchievementMetric.TopDirectorCount, TargetValue = 100 },

        // Per-decade specialists
        new() { Id = "decade-60s", Key = "decade_60s", Title = "60s Kid", Description = "Watch 15 items from the 1960s.", Icon = "radio", Category = "Decades", Rarity = "Uncommon", Metric = AchievementMetric.DecadeItemsWatched, MetricParameter = "1960", TargetValue = 15 },
        new() { Id = "decade-70s", Key = "decade_70s", Title = "70s Fan", Description = "Watch 15 items from the 1970s.", Icon = "album", Category = "Decades", Rarity = "Uncommon", Metric = AchievementMetric.DecadeItemsWatched, MetricParameter = "1970", TargetValue = 15 },
        new() { Id = "decade-80s", Key = "decade_80s", Title = "80s Child", Description = "Watch 15 items from the 1980s.", Icon = "audiotrack", Category = "Decades", Rarity = "Uncommon", Metric = AchievementMetric.DecadeItemsWatched, MetricParameter = "1980", TargetValue = 15 },
        new() { Id = "decade-90s", Key = "decade_90s", Title = "90s Nostalgic", Description = "Watch 15 items from the 1990s.", Icon = "music_note", Category = "Decades", Rarity = "Uncommon", Metric = AchievementMetric.DecadeItemsWatched, MetricParameter = "1990", TargetValue = 15 },
        new() { Id = "decade-00s", Key = "decade_00s", Title = "Y2K Survivor", Description = "Watch 15 items from the 2000s.", Icon = "phone_iphone", Category = "Decades", Rarity = "Uncommon", Metric = AchievementMetric.DecadeItemsWatched, MetricParameter = "2000", TargetValue = 15 },
        new() { Id = "decade-10s", Key = "decade_10s", Title = "Streaming Era", Description = "Watch 15 items from the 2010s.", Icon = "connected_tv", Category = "Decades", Rarity = "Uncommon", Metric = AchievementMetric.DecadeItemsWatched, MetricParameter = "2010", TargetValue = 15 },
        new() { Id = "decade-20s", Key = "decade_20s", Title = "Modern Times", Description = "Watch 15 items from the 2020s.", Icon = "devices", Category = "Decades", Rarity = "Uncommon", Metric = AchievementMetric.DecadeItemsWatched, MetricParameter = "2020", TargetValue = 15 },

        // Day of week specialists
        new() { Id = "dow-monday", Key = "dow_monday", Title = "Monday Motivator", Description = "Watch 20 items on Mondays.", Icon = "calendar_today", Category = "Weekdays", Rarity = "Uncommon", Metric = AchievementMetric.DayOfWeekItemsWatched, MetricParameter = "Monday", TargetValue = 20 },
        new() { Id = "dow-tuesday", Key = "dow_tuesday", Title = "Tuesday Tradition", Description = "Watch 20 items on Tuesdays.", Icon = "calendar_today", Category = "Weekdays", Rarity = "Uncommon", Metric = AchievementMetric.DayOfWeekItemsWatched, MetricParameter = "Tuesday", TargetValue = 20 },
        new() { Id = "dow-wednesday", Key = "dow_wednesday", Title = "Wednesday Warrior", Description = "Watch 20 items on Wednesdays.", Icon = "calendar_today", Category = "Weekdays", Rarity = "Uncommon", Metric = AchievementMetric.DayOfWeekItemsWatched, MetricParameter = "Wednesday", TargetValue = 20 },
        new() { Id = "dow-thursday", Key = "dow_thursday", Title = "Thursday Thrills", Description = "Watch 20 items on Thursdays.", Icon = "calendar_today", Category = "Weekdays", Rarity = "Uncommon", Metric = AchievementMetric.DayOfWeekItemsWatched, MetricParameter = "Thursday", TargetValue = 20 },
        new() { Id = "dow-friday", Key = "dow_friday", Title = "Friday Feast", Description = "Watch 20 items on Fridays.", Icon = "weekend", Category = "Weekdays", Rarity = "Uncommon", Metric = AchievementMetric.DayOfWeekItemsWatched, MetricParameter = "Friday", TargetValue = 20 },
        new() { Id = "dow-saturday", Key = "dow_saturday", Title = "Saturday Sessioner", Description = "Watch 20 items on Saturdays.", Icon = "weekend", Category = "Weekdays", Rarity = "Uncommon", Metric = AchievementMetric.DayOfWeekItemsWatched, MetricParameter = "Saturday", TargetValue = 20 },
        new() { Id = "dow-sunday", Key = "dow_sunday", Title = "Lazy Sunday", Description = "Watch 20 items on Sundays.", Icon = "bed", Category = "Weekdays", Rarity = "Uncommon", Metric = AchievementMetric.DayOfWeekItemsWatched, MetricParameter = "Sunday", TargetValue = 20 },

        // Binge Marathon (total minutes in one day)
        new() { Id = "binge-marathon-300", Key = "binge_marathon_300", Title = "Binge Marathon", Description = "Watch 300 minutes (5 hours) in a single day.", Icon = "timer", Category = "Endurance", Rarity = "Epic", Metric = AchievementMetric.MaxMinutesInSingleDay, TargetValue = 300 },
        new() { Id = "binge-marathon-600", Key = "binge_marathon_600", Title = "Ultra Marathon", Description = "Watch 600 minutes (10 hours) in a single day.", Icon = "hourglass_full", Category = "Endurance", Rarity = "Legendary", Metric = AchievementMetric.MaxMinutesInSingleDay, TargetValue = 600 },
        new() { Id = "binge-marathon-900", Key = "binge_marathon_900", Title = "Day-Long Binge", Description = "Watch 900 minutes (15 hours) in a single day.", Icon = "av_timer", Category = "Endurance", Rarity = "Mythic", Metric = AchievementMetric.MaxMinutesInSingleDay, TargetValue = 900 },

        // Max items in single library
        new() { Id = "lib-specialist-100", Key = "lib_specialist_100", Title = "Library Specialist", Description = "Watch 100 items from a single library.", Icon = "library_books", Category = "Library Completion", Rarity = "Epic", Metric = AchievementMetric.MaxLibraryItemCount, TargetValue = 100 },
        new() { Id = "lib-specialist-500", Key = "lib_specialist_500", Title = "Library Master", Description = "Watch 500 items from a single library.", Icon = "menu_book", Category = "Library Completion", Rarity = "Legendary", Metric = AchievementMetric.MaxLibraryItemCount, TargetValue = 500 },

        // Actor Superfan extremes
        new() { Id = "actor-devotee-75", Key = "actor_devotee_75", Title = "Actor Devotee", Description = "Watch 75 items featuring the same actor.", Icon = "face", Category = "People", Rarity = "Legendary", Metric = AchievementMetric.TopActorCount, TargetValue = 75 },
        new() { Id = "actor-devotee-150", Key = "actor_devotee_150", Title = "Actor Obsession", Description = "Watch 150 items featuring the same actor.", Icon = "theater_comedy", Category = "People", Rarity = "Mythic", Metric = AchievementMetric.TopActorCount, TargetValue = 150 },

        // Ultra episode/movie marathons
        new() { Id = "movies-10-day", Key = "movies_10_day", Title = "Ultra Movie Marathon", Description = "Watch 10 movies in a single day.", Icon = "theaters", Category = "Film Marathons", Rarity = "Mythic", Metric = AchievementMetric.MaxMoviesInSingleDay, TargetValue = 10 },
        new() { Id = "episodes-50-day", Key = "episodes_50_day", Title = "Binge Everest", Description = "Watch 50 episodes in a single day.", Icon = "tv", Category = "Episode Marathons", Rarity = "Mythic", Metric = AchievementMetric.MaxEpisodesInSingleDay, TargetValue = 50 }
    };
}
