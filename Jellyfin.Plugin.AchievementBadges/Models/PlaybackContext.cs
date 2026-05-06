using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Models;

public class PlaybackContext
{
    public string UserId { get; set; } = string.Empty;
    public string? ItemId { get; set; }
    public bool IsMovie { get; set; }
    public bool IsEpisode { get; set; }
    public bool SeriesCompleted { get; set; }
    public int CompletedSeriesEpisodeCount { get; set; }
    public string? LibraryName { get; set; }
    public DateTimeOffset? PlayedAt { get; set; }

    public int? ProductionYear { get; set; }
    public IReadOnlyList<string>? ProductionLocations { get; set; }
    public string? OriginalLanguage { get; set; }
    public IReadOnlyList<string>? Genres { get; set; }
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
