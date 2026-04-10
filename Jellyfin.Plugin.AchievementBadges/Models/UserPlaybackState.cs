using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Models;

public class UserPlaybackState
{
    public string UserId { get; set; } = string.Empty;

    public Dictionary<string, DateTimeOffset> RecentlyCompletedItemIds { get; set; } = new();

    public int TotalCompletedItems { get; set; }

    public int TotalCompletedMovies { get; set; }

    public int TotalCompletedEpisodes { get; set; }

    public DateTimeOffset? LastCompletionAt { get; set; }
}
