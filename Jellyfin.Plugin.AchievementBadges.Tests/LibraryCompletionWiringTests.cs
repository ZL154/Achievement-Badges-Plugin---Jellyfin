using System;
using System.Linq;
using System.Reflection;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #79, first half. The library completion metric, its service and its
/// five badges have existed for a while, but the only caller of the recompute
/// was an endpoint nothing invokes, so the percentages stayed empty and those
/// badges sat at zero on every install. These pin the wiring that fixes it.
/// </summary>
public class LibraryCompletionWiringTests
{
    [Fact]
    public void TheBackfillCanReachTheCompletionService()
    {
        // The whole defect was that nothing called RecomputeForUser. If this
        // dependency is ever dropped from the constructor, the percentages go
        // back to never being computed, and the symptom is five badges quietly
        // stuck at zero rather than an error.
        var constructor = typeof(WatchHistoryBackfillService)
            .GetConstructors()
            .Single();

        Assert.Contains(
            constructor.GetParameters(),
            p => p.ParameterType == typeof(LibraryCompletionService));
    }

    [Fact]
    public void TheBackfillCanReachTheWatchCarryStore()
    {
        // Same shape of defect, different store. The carry was owned privately
        // by PlaybackCompletionTracker, so the scan could not drop the carry of
        // items it credited. Those minutes stayed banked and a later partial
        // rewatch reached the 80% gate on time already spent: measured live, an
        // item sat at 72.3% carried after being credited.
        //
        // Being straight about what this proves: it pins the dependency, not
        // the call. Exercising the call needs the whole backfill stack, and the
        // evidence for it is the live run recorded in the PR, not this test.
        var constructor = typeof(WatchHistoryBackfillService)
            .GetConstructors()
            .Single();

        Assert.Contains(
            constructor.GetParameters(),
            p => p.ParameterType == typeof(Helpers.WatchCarryStore));
    }

    [Fact]
    public void TheLibraryBadgesStillReadTheMetricTheyAlwaysDid()
    {
        // Guards the other end: wiring the producer is pointless if the badges
        // stop reading it. Six, not five: the visible ladder plus the hidden
        // Completionist Supreme, which also sits on 100.
        var badges = AchievementDefinitions.All
            .Where(d => d.Metric == AchievementMetric.LibraryCompletionPercent)
            .ToList();

        Assert.Equal(6, badges.Count);
        Assert.Equal(
            new[] { 10, 25, 50, 75, 100, 100 },
            badges.Select(b => b.TargetValue).OrderBy(v => v).ToArray());
        Assert.Contains(badges, b => b.Key == "hidden_completionist");
    }

    [Fact]
    public void CompletionPercentagesSurviveARoundTripThroughTheCounters()
    {
        var counters = new UserAchievementCounters();
        Assert.Equal(0, counters.BestLibraryCompletionPercent);
        Assert.Equal(0, counters.LibrariesAt100PercentCount);

        counters.LibraryCompletionPercents["Movies"] = 85;
        counters.LibraryCompletionPercents["Shows"] = 100;

        // The unparameterised reading is "your best library", which is what a
        // badge like "reach 50% in any library" means.
        Assert.Equal(100, counters.BestLibraryCompletionPercent);
        Assert.Equal(1, counters.LibrariesAt100PercentCount);
    }
}
