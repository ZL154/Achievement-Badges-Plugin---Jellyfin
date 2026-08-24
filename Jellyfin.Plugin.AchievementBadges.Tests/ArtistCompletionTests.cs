using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #79, second half: discography completion per artist.
/// <para>
/// Worth saying plainly, since it changes how much these tests are worth: my
/// own library has no audio at all, so unlike the library half of #79 I could
/// not exercise this against real data. Everything below is unit level, and
/// the library queries themselves are unverified in practice.
/// </para>
/// </summary>
public class ArtistCompletionTests
{
    [Fact]
    public void TheMetricKeepsItsOrdinal_SoStoredValuesDoNotShift()
    {
        // Badge progress is serialised by enum ordinal. Inserting a value in
        // the middle would silently repoint every stored badge above it at a
        // different metric, which is unrecoverable without a rebuild.
        //
        // This used to assert the metric was LAST in the enum, which is a
        // proxy for the real invariant and fails on every correct append after
        // it (issue #107 added two). Pinning the ordinal tests the thing that
        // actually matters: 70 is where this metric's stored values live, and
        // it must stay 70 forever.
        Assert.Equal(70, (int)AchievementMetric.ArtistCompletionPercent);
    }

    [Fact]
    public void CompletionReadsBestArtistWhenNoArtistIsNamed()
    {
        var counters = new UserAchievementCounters();
        Assert.Equal(0, counters.BestArtistCompletionPercent);

        counters.ArtistCompletionPercents["Boards of Canada"] = 40;
        counters.ArtistCompletionPercents["Aphex Twin"] = 95;

        // "Hear 50% of one artist's tracks" means any artist, so the
        // unparameterised reading has to be the best one, not a total or an
        // average.
        Assert.Equal(95, counters.BestArtistCompletionPercent);
    }

    [Fact]
    public void TheLadderMirrorsTheLibraryOne()
    {
        var artist = AchievementDefinitions.All
            .Where(d => d.Metric == AchievementMetric.ArtistCompletionPercent)
            .Select(d => d.TargetValue)
            .OrderBy(v => v)
            .ToArray();

        Assert.Equal(new[] { 10, 25, 50, 75, 100 }, artist);
    }

    [Fact]
    public void DiscographyBadgesAreTheirOwnCategory_NotFoldedIntoMusic()
    {
        // They read a different kind of number from every other music badge:
        // a ratio against the library rather than an accumulated play count.
        var badges = AchievementDefinitions.All
            .Where(d => d.Metric == AchievementMetric.ArtistCompletionPercent)
            .ToList();

        Assert.All(badges, b => Assert.Equal("Discography", b.Category));
        Assert.Contains(badges, b => b.Key == "artist_discography" && b.Rarity == "Legendary");
    }
}
