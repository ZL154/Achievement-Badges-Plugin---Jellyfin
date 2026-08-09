using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Models;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// [issue #45] Decides which of Tracearr's plays a backfill should credit,
/// and which of those count as rewatches.
/// <para>
/// Kept as a pure function on purpose. This is the one place where a mistake
/// inflates real people's totals rather than merely losing some, and inflated
/// totals cannot be walked back without the reset that loses everything else.
/// </para>
/// </summary>
public static class TracearrCreditPlan
{
    /// <summary>One play to credit, and whether it is a repeat viewing.</summary>
    public readonly record struct Credit(TracearrPlay Play, bool IsRewatch);

    /// <summary>
    /// Given every play Tracearr holds for a user, and the item ids the
    /// library replay already credited, returns what is left to credit.
    /// <para>
    /// The rules, and why:
    /// </para>
    /// <list type="bullet">
    /// <item>Only plays Tracearr considers finished count, so a thirty second
    /// sample does not become a watch.</item>
    /// <item>An item the library already credited contributes no first watch
    /// here. That is what stops the two sources counting one viewing twice.
    /// </item>
    /// <item>An item the library could not prove has been deleted since it was
    /// watched, so its earliest play is a genuine first watch.</item>
    /// <item>Every later play of anything is a rewatch. The library query is
    /// <c>IsPlayed = true</c>, a boolean, so it can never produce a rewatch
    /// count however many times an item was played.</item>
    /// </list>
    /// </summary>
    public static List<Credit> Build(
        IEnumerable<TracearrPlay>? plays,
        ISet<string>? alreadyCredited,
        IReadOnlySet<string>? alreadyCreditedPlayIds = null)
    {
        var result = new List<Credit>();
        if (plays is null) return result;

        var seen = alreadyCredited ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var ledger = alreadyCreditedPlayIds ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var groups = plays
            .Where(p => p is not null && p.Watched && !string.IsNullOrWhiteSpace(p.RatingKey))
            .GroupBy(p => p.RatingKey!, StringComparer.OrdinalIgnoreCase);

        foreach (var group in groups)
        {
            var libraryAlreadyCreditedIt = seen.Contains(group.Key);

            // Oldest first, so the earliest viewing is the one that counts as
            // the first watch and the later ones as repeats, rather than the
            // order the API happened to return them in.
            var ordered = group
                .OrderBy(p => p.StartedAt ?? DateTimeOffset.MinValue)
                .ToList();

            for (var i = 0; i < ordered.Count; i++)
            {
                if (libraryAlreadyCreditedIt && i == 0) continue;

                // Already counted on a previous sync. Skipped after the
                // position check, not before, so removing it from the list
                // cannot shift which play counts as the first watch.
                if (!string.IsNullOrWhiteSpace(ordered[i].Id) && ledger.Contains(ordered[i].Id!)) continue;

                result.Add(new Credit(ordered[i], libraryAlreadyCreditedIt || i > 0));
            }
        }

        return result;
    }
}
