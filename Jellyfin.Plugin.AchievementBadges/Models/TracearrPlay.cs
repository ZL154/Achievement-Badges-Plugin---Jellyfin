using System;

namespace Jellyfin.Plugin.AchievementBadges.Models;

/// <summary>
/// [issue #45] One play from Tracearr's history, reduced to the fields this
/// plugin can act on. Tracearr's payload is much wider (codecs, bitrates,
/// devices, geo); none of that feeds a badge, so it is not carried here.
/// </summary>
public class TracearrPlay
{
    /// <summary>
    /// The media server's own item id, Tracearr's <c>rating_key</c>. For a
    /// Jellyfin server this is the item GUID, which is what lets a play be
    /// matched against what the library replay already credited.
    /// </summary>
    public string? RatingKey { get; set; }

    /// <summary>movie, episode, track, live, photo or unknown.</summary>
    public string? MediaType { get; set; }

    public string? MediaTitle { get; set; }

    public string? ShowTitle { get; set; }

    public int? Year { get; set; }

    /// <summary>When the play started. Used as the credit date, so a play from
    /// last year lands on last year rather than today.</summary>
    public DateTimeOffset? StartedAt { get; set; }

    /// <summary>Time actually watched, not the item's runtime.</summary>
    public long? DurationMs { get; set; }

    /// <summary>The item's full runtime, when Tracearr knows it.</summary>
    public long? TotalDurationMs { get; set; }

    /// <summary>Tracearr's own judgement that the item was finished.</summary>
    public bool Watched { get; set; }
}
