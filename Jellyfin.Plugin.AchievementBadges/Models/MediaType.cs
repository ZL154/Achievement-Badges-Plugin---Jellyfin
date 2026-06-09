namespace Jellyfin.Plugin.AchievementBadges.Models;

/// <summary>
/// [v2.1.0 "Open Library"] Classifies which Jellyfin media a badge tracks.
/// Used to route playback events to the right counter pipeline and to
/// group badges in the user-facing UI. <c>Multi</c> is for badges that
/// span media types (e.g. "Watch any 1000 items"). <c>Anime</c> is a
/// behavioural sub-classification on top of Film/TV — kept as a top-
/// level value because anime badges are visible on their own tab.
///
/// New fields on <see cref="AchievementDefinition"/> default to
/// <see cref="Film"/> so v2.0.x built-in definitions deserialize cleanly
/// without migration.
/// </summary>
public enum MediaType
{
    Film = 0,
    TV = 1,
    Music = 2,
    Book = 3,
    Anime = 4,
    Multi = 5,
}
