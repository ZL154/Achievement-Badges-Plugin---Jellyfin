using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #107. The recompute is bounded by what the badges actually
/// reference, so this walk is the thing standing between a targeted badge and
/// a full library sweep on every play. These pin the walk, the dedup and the
/// cap, including the case the cap exists for: an admin who authored more
/// targets than the server should chase.
/// </summary>
public class ObservedTargetsTests
{
    private static CustomBadge Leaf(AchievementMetric metric, string parameter, bool enabled = true)
    {
        return new CustomBadge
        {
            Name = parameter,
            Enabled = enabled,
            Criteria = new CustomBadgeCriteria
            {
                Metric = metric,
                MetricParameter = parameter,
                Threshold = 100,
            },
        };
    }

    private static string Ref(string name) => Guid.NewGuid().ToString("N") + "|" + name;

    [Fact]
    public void ALeafTargetIsCollected()
    {
        var badges = new[] { Leaf(AchievementMetric.ContainerCompletionPercent, Ref("One Piece")) };

        var targets = ObservedTargets.Collect(badges, cap: 50, out var dropped);

        var target = Assert.Single(targets);
        Assert.Equal(AchievementMetric.ContainerCompletionPercent, target.Metric);
        Assert.Equal("One Piece", target.Name);
        Assert.NotEqual(Guid.Empty, target.Id);
        Assert.Empty(dropped);
    }

    [Fact]
    public void TargetsNestedInsideCompoundTreesAreFound()
    {
        // The form writes leaves, but the API writes trees. A target buried in
        // an AND that nobody collects is a badge that never progresses.
        var badge = new CustomBadge
        {
            Name = "Arc completionist",
            Criteria = new CustomBadgeCriteria
            {
                Operator = CompoundOperator.And,
                Children = new List<CustomBadgeCriteria>
                {
                    new() { Metric = AchievementMetric.MoviesWatched, Threshold = 10 },
                    new()
                    {
                        Operator = CompoundOperator.Or,
                        Children = new List<CustomBadgeCriteria>
                        {
                            new()
                            {
                                Metric = AchievementMetric.ItemPlayCount,
                                MetricParameter = Ref("3005"),
                                Threshold = 3005,
                            },
                        },
                    },
                },
            },
        };

        var targets = ObservedTargets.Collect(new[] { badge }, cap: 50, out _);

        Assert.Single(targets);
        Assert.Equal("3005", targets[0].Name);
    }

    [Fact]
    public void DisabledBadgesAndUntargetedMetricsContributeNothing()
    {
        var badges = new[]
        {
            Leaf(AchievementMetric.ContainerCompletionPercent, Ref("Hidden"), enabled: false),
            Leaf(AchievementMetric.MoviesWatched, "not a target"),
        };

        Assert.Empty(ObservedTargets.Collect(badges, cap: 50, out _));
    }

    [Fact]
    public void TheSameTargetReferencedTwiceIsComputedOnce()
    {
        // Two badges on the same series (50% and 100%) are the normal way to
        // build a ladder. Computing that series twice per play is pure waste.
        var shared = Ref("One Piece");
        var badges = new[]
        {
            Leaf(AchievementMetric.ContainerCompletionPercent, shared),
            Leaf(AchievementMetric.ContainerCompletionPercent, shared),
        };

        Assert.Single(ObservedTargets.Collect(badges, cap: 50, out _));
    }

    [Fact]
    public void TheCapIsEnforcedAndReportsWhatItDropped()
    {
        // A silent cap reads as "everything is covered" when it is not, which
        // is the worst way for a limit to behave.
        var badges = Enumerable.Range(0, 5)
            .Select(i => Leaf(AchievementMetric.ContainerCompletionPercent, Ref("Series " + i)))
            .ToArray();

        var targets = ObservedTargets.Collect(badges, cap: 3, out var dropped);

        Assert.Equal(3, targets.Count);
        Assert.Equal(2, dropped.Count);
    }

    [Fact]
    public void ANameOnlyTargetIsStillObserved()
    {
        // It has no GUID yet, so it reads as zero progress; collecting it is
        // exactly how it gets resolved and rewritten.
        var targets = ObservedTargets.Collect(
            new[] { Leaf(AchievementMetric.ContainerCompletionPercent, "One Piece") },
            cap: 50,
            out _);

        var target = Assert.Single(targets);
        Assert.Equal(Guid.Empty, target.Id);
        Assert.Equal("One Piece", target.Name);
    }
}
