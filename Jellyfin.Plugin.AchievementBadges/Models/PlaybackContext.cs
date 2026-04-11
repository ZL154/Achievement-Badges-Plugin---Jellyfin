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

    public bool Silent { get; set; }
}
