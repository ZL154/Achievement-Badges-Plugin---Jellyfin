namespace Jellyfin.Plugin.AchievementBadges.Models;

public enum AchievementMetric
{
    TotalItemsWatched,
    MoviesWatched,
    SeriesCompleted,
    LateNightSessions,
    EarlyMorningSessions,
    WeekendSessions,
    UniqueLibrariesVisited,
    DaysWatched,
    CurrentWatchStreak,
    BestWatchStreak,
    MaxEpisodesInSingleDay,
    MaxMoviesInSingleDay,
    UniqueDecadesWatched,
    UniqueCountriesWatched,
    UniqueLanguagesWatched,
    UniqueGenresWatched,
    TotalMinutesWatched,
    LongestItemMinutes,
    ShortItemsWatched,
    WatchedOnChristmas,
    WatchedOnNewYear,
    WatchedOnHalloween,
    WatchedOnEid,
    LongSeriesCompleted,
    VeryLongSeriesCompleted,
    RewatchCount,
    GenreItemsWatched,
    LibraryCompletionPercent,
    DaysLoggedIn,
    CurrentLoginStreak,
    BestLoginStreak,
    TopDirectorCount,
    TopActorCount,
    PersonItemsWatched,
    PrestigeLevel,
    LifetimeScore,
    BestComboCount,
    LibrariesAt100Percent,
    BadgesUnlockedPercent,
    DecadeItemsWatched,
    DayOfWeekItemsWatched,
    MaxLibraryItemCount,
    MaxMinutesInSingleDay,
    // v1.9.3 — Time of day fillers for the 9–17 / 19–22 windows.
    AfternoonSessions,
    PrimeTimeSessions,
    // v1.9.3 — Holidays expansion.
    WatchedOnValentines,
    WatchedOnEaster,
    WatchedOnLunarNewYear,
    WatchedOnDiwali,
    WatchedOnThanksgiving,
    WatchedOnIndependenceDayUS,
    WatchedOnBonfireNight,
    WatchedOnBoxingDay,
    WatchedOnMothersDay,
    WatchedOnFathersDay,
    // v1.9.3 — Anime tier (genre/tag detection).
    AnimeItemsWatched,
    // v1.9.3 — Studio specialists (MetricParameter = studio name).
    StudioItemsWatched,
    // v1.9.3 — Pilot vs completer behavior.
    SeriesSampledOnly,
    SeriesBingedAfterPilot,

    // ─── v2.1.0 "Open Library" — Music metrics (M2) ───────────────────
    MusicPlaysTotal,
    MusicListeningHours,
    UniqueMusicAlbums,
    UniqueMusicArtists,
    UniqueMusicGenres,
    UniqueMusicDecades,

    // ─── v2.1.0 "Open Library" — Book metrics (M3) ────────────────────
    BooksCompleted,
    AudiobookListeningHours,
    UniqueBookSeriesCompleted,

    // [issue #24] Parametrized MUSIC-genre metrics. The badge's
    // MetricParameter carries the genre name (e.g. "disco"); matched
    // case-insensitively against MusicGenrePlayCounts /
    // MusicGenreListeningSeconds. Appended at the end so existing
    // serialized ordinals are unchanged.
    MusicGenrePlays,
    MusicGenreListeningHours,

    // [issue #79] Discography completion for one artist, or the best artist
    // when no MetricParameter is set. Appended at the end for the same reason
    // as the two above: existing serialized ordinals must not shift.
    ArtistCompletionPercent,

    // [issue #107] Targeted metrics. MetricParameter carries "{guid:N}|{name}"
    // (see Helpers/TargetRef). ContainerCompletionPercent is played leaves over
    // total leaves of one series, season, collection, playlist or album;
    // ItemPlayCount is Jellyfin's own play count for one item, which is what
    // makes "play this track 3005 times" evaluate against history that already
    // exists. Appended at the end for the same reason as the three above:
    // existing serialized ordinals must not shift.
    ContainerCompletionPercent,
    ItemPlayCount,
}
