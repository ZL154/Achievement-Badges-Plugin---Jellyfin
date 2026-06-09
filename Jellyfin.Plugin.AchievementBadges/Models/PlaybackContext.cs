using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Models;

public class PlaybackContext
{
    public string UserId { get; set; } = string.Empty;
    public string? ItemId { get; set; }
    public bool IsMovie { get; set; }
    public bool IsEpisode { get; set; }

    // [v2.1.0 "Open Library", M2/M3] Multi-media expansion. v2.0.x only
    // produced contexts for Movie and Episode items; M2+M3 extend the
    // tracker to fire for Audio (music + audiobook) and Book items
    // too. AudiobookCounting policy lives in PluginConfiguration and
    // is enforced by AchievementBadgeService.RecordPlayback when
    // routing the increments.
    public bool IsMusic { get; set; }
    public bool IsAudiobook { get; set; }
    public bool IsBook { get; set; }

    // Music-specific metadata (null on non-music plays).
    public string? Album { get; set; }
    public IReadOnlyList<string>? Artists { get; set; }
    public IReadOnlyList<string>? AlbumArtists { get; set; }
    public bool SeriesCompleted { get; set; }
    public int CompletedSeriesEpisodeCount { get; set; }
    public string? LibraryName { get; set; }
    public DateTimeOffset? PlayedAt { get; set; }

    public int? ProductionYear { get; set; }
    public IReadOnlyList<string>? ProductionLocations { get; set; }
    public string? OriginalLanguage { get; set; }
    public IReadOnlyList<string>? Genres { get; set; }

    /// <summary>[v2.1.0 "Open Library", issue #25] Tags from the played item
    /// AND inherited from its parent Series (for Episodes). Used by the
    /// anime detector and any future tag-driven badges. Many users
    /// classify their anime via Tags rather than Genres, and even those
    /// who use Genres often set them only on the Series (not on each
    /// Episode); the tracker now reads both fields from both levels.</summary>
    public IReadOnlyList<string>? Tags { get; set; }

    public long? RunTimeTicks { get; set; }

    public bool IsRewatch { get; set; }

    public IReadOnlyList<string>? Directors { get; set; }
    public IReadOnlyList<string>? Actors { get; set; }

    // v1.9.3 — Studio names from BaseItem.Studios. Used by the
    // StudioItemsWatched parameterized metric (Studio Ghibli, A24, etc).
    public IReadOnlyList<string>? Studios { get; set; }

    // v1.9.3 — Series identity for pilot-vs-completer tracking.
    // SeriesId: stable per-series Guid (formatted "D"). Episodes only.
    // SeasonNumber/EpisodeNumber: from BaseItem.ParentIndexNumber/IndexNumber.
    // S1E1 = pilot; any other ep of a series whose pilot has been watched
    // graduates the series into ContinuedPastPilot.
    public string? SeriesId { get; set; }
    public int? SeasonNumber { get; set; }
    public int? EpisodeNumber { get; set; }

    public bool Silent { get; set; }
}
