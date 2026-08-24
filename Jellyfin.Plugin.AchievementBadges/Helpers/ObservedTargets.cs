using System;
using System.Collections.Generic;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// [issue #107] One target a badge points at, after parsing.
/// </summary>
/// <param name="Metric">Which targeted metric referenced it.</param>
/// <param name="Parameter">The raw MetricParameter, kept so the resolver can
/// rewrite it in place when the name lookup wins over a stale GUID.</param>
/// <param name="Id">Target GUID, or Guid.Empty when the badge was authored by
/// name and has not been resolved yet.</param>
/// <param name="Name">Display name, used as the fallback lookup key.</param>
public sealed record ObservedTarget(AchievementMetric Metric, string Parameter, Guid Id, string Name);

/// <summary>
/// [issue #107] Collects the targets that enabled custom badges reference.
/// <para>
/// This walk is what bounds the whole feature's cost. Container completion
/// has no natural aggregate question behind it ("how many containers did this
/// user finish" is not a badge anyone asked for), so without it the metric
/// would imply sweeping every series, season, collection and playlist on the
/// server. With it, the work is proportional to what an admin authored.
/// </para>
/// </summary>
public static class ObservedTargets
{
    public static bool IsTargeted(AchievementMetric metric)
    {
        return metric is AchievementMetric.ContainerCompletionPercent
            or AchievementMetric.ItemPlayCount;
    }

    public static IReadOnlyList<ObservedTarget> Collect(
        IEnumerable<CustomBadge> badges,
        int cap,
        out IReadOnlyList<string> dropped)
    {
        var found = new List<ObservedTarget>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var overflow = new List<string>();

        if (badges is not null)
        {
            foreach (var badge in badges)
            {
                if (badge is null || !badge.Enabled || badge.Criteria is null)
                {
                    continue;
                }

                Walk(badge.Criteria, depth: 1, found, seen, overflow, cap);
            }
        }

        dropped = overflow;
        return found;
    }

    private static void Walk(
        CustomBadgeCriteria node,
        int depth,
        List<ObservedTarget> found,
        HashSet<string> seen,
        List<string> overflow,
        int cap)
    {
        // Depth is already bounded at write time by CustomBadgeService, but a
        // definition file edited by hand reaches this walk without passing
        // through Upsert.
        if (node is null || depth > CustomBadgeService.MaxCriteriaDepth)
        {
            return;
        }

        if (node.Children is { Count: > 0 })
        {
            foreach (var child in node.Children)
            {
                Walk(child, depth + 1, found, seen, overflow, cap);
            }

            return;
        }

        if (node.Metric is not { } metric || !IsTargeted(metric))
        {
            return;
        }

        if (!TargetRef.TryParse(node.MetricParameter, out var id, out var name)
            || string.IsNullOrWhiteSpace(name))
        {
            return;
        }

        var key = metric + " " + (id != Guid.Empty ? id.ToString("N") : name);
        if (!seen.Add(key))
        {
            return;
        }

        if (found.Count >= cap)
        {
            // Named rather than counted: a silent cap reads as full coverage.
            overflow.Add(name);
            return;
        }

        found.Add(new ObservedTarget(metric, node.MetricParameter ?? name, id, name));
    }
}
