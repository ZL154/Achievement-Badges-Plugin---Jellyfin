using System;
using System.Collections.Generic;
using System.Reflection;
using Jellyfin.Plugin.AchievementBadges.Models;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// Merges a pre scan snapshot of <see cref="UserAchievementCounters"/> into the
/// counters a watch history rebuild just produced, so a scan can only ever move
/// counters forward (companion to issue #48).
/// <para>
/// A rebuild replays what the library holds today. Media deleted since it was
/// watched is invisible to that replay, so every lifetime total it once fed
/// would silently shrink. Unlocked badges already survive a reset (PR #51);
/// this keeps the counters honest too: numeric totals and high water marks take
/// the larger value, sticky holiday flags stay set, distinct value sets union,
/// per key tallies keep the larger count per key, and dates keep the later day.
/// Fields the replay can fully reconstruct simply keep the replayed value,
/// because the snapshot holds nothing bigger.
/// </para>
/// </summary>
public static class CounterFloor
{
    /// <summary>
    /// Applies <paramref name="previous"/> as a floor onto
    /// <paramref name="rebuilt"/>, mutating <paramref name="rebuilt"/> in
    /// place. Reflection based on purpose: counters added by future upstream
    /// versions are covered automatically instead of silently escaping the
    /// floor. Computed properties have no setter and are skipped.
    /// </summary>
    public static void Apply(UserAchievementCounters previous, UserAchievementCounters rebuilt)
    {
        ArgumentNullException.ThrowIfNull(previous);
        ArgumentNullException.ThrowIfNull(rebuilt);

        foreach (var property in typeof(UserAchievementCounters).GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (!property.CanRead)
            {
                continue;
            }

            if (property.PropertyType == typeof(int) && property.CanWrite)
            {
                var prev = (int)property.GetValue(previous)!;
                var curr = (int)property.GetValue(rebuilt)!;
                if (prev > curr)
                {
                    property.SetValue(rebuilt, prev);
                }
            }
            else if (property.PropertyType == typeof(long) && property.CanWrite)
            {
                var prev = (long)property.GetValue(previous)!;
                var curr = (long)property.GetValue(rebuilt)!;
                if (prev > curr)
                {
                    property.SetValue(rebuilt, prev);
                }
            }
            else if (property.PropertyType == typeof(bool) && property.CanWrite)
            {
                if ((bool)property.GetValue(previous)!)
                {
                    property.SetValue(rebuilt, true);
                }
            }
            else if (property.PropertyType == typeof(DateOnly?) && property.CanWrite)
            {
                var prev = (DateOnly?)property.GetValue(previous);
                var curr = (DateOnly?)property.GetValue(rebuilt);
                if (prev.HasValue && (!curr.HasValue || prev.Value > curr.Value))
                {
                    property.SetValue(rebuilt, prev);
                }
            }
            else if (property.GetValue(previous) is HashSet<string> prevStrings && property.GetValue(rebuilt) is HashSet<string> currStrings)
            {
                currStrings.UnionWith(prevStrings);
            }
            else if (property.GetValue(previous) is HashSet<int> prevInts && property.GetValue(rebuilt) is HashSet<int> currInts)
            {
                currInts.UnionWith(prevInts);
            }
            else if (property.GetValue(previous) is Dictionary<string, int> prevCounts && property.GetValue(rebuilt) is Dictionary<string, int> currCounts)
            {
                foreach (var (key, value) in prevCounts)
                {
                    if (!currCounts.TryGetValue(key, out var existing) || value > existing)
                    {
                        currCounts[key] = value;
                    }
                }
            }
            else if (property.GetValue(previous) is Dictionary<string, long> prevLongCounts && property.GetValue(rebuilt) is Dictionary<string, long> currLongCounts)
            {
                foreach (var (key, value) in prevLongCounts)
                {
                    if (!currLongCounts.TryGetValue(key, out var existing) || value > existing)
                    {
                        currLongCounts[key] = value;
                    }
                }
            }
        }
    }
}
