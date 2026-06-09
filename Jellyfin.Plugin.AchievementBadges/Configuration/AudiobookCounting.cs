namespace Jellyfin.Plugin.AchievementBadges.Configuration;

/// <summary>
/// [v2.1.0 "Open Library"] Controls how audiobook playback events are
/// counted against the new Music and Books metrics. Jellyfin tags
/// audiobooks as <c>Audio</c> media with book-style metadata; the
/// "correct" attribution is a matter of taste.
///
/// Default <see cref="BooksOnly"/> — listening to an audiobook
/// progresses your Books achievements (completion, reading time) but
/// does NOT inflate Music counters (album completion, unique artists).
/// Admins who treat audiobooks as a music-flavoured activity can
/// switch to <see cref="MusicOnly"/> or <see cref="Both"/> in plugin
/// settings.
/// </summary>
public enum AudiobookCounting
{
    /// <summary>Audiobook plays count toward Books badges only.
    /// Music counters are not incremented. Default.</summary>
    BooksOnly = 0,

    /// <summary>Audiobook plays count toward Music badges only.
    /// Books counters are not incremented.</summary>
    MusicOnly = 1,

    /// <summary>Audiobook plays count toward both Books and Music
    /// badges. Most generous; double-credits the listener.</summary>
    Both = 2,
}
