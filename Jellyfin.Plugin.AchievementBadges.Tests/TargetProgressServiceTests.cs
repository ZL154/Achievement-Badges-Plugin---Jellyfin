using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Configuration;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Controller.Library;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #107. Two things are worth pinning here and one is not. The
/// percentage arithmetic is pure and gets a real test, including the zero
/// case that would otherwise hand out a badge for an empty container. The
/// wiring gets a reflection test, the way LibraryCompletionWiringTests pins
/// the backfill: a dependency silently dropped from the constructor is how
/// this codebase has produced quietly-stuck badges twice before. Exercising
/// the queries themselves needs a live library, so that evidence belongs in
/// the PR as a recorded run, not in a mock here.
/// </summary>
public class TargetProgressServiceTests
{
    [Fact]
    public void AnEmptyContainerIsNotComplete()
    {
        // Zero of zero reads as 100 in any naive percentage, which would hand
        // out "you finished it" for an empty collection. LibraryCompletion
        // already skips on total == 0 for the same reason.
        Assert.Null(TargetProgressService.Percent(total: 0, played: 0));
    }

    [Fact]
    public void PercentagesRoundTheWayTheRestOfThePluginDoes()
    {
        Assert.Equal(0, TargetProgressService.Percent(10, 0));
        Assert.Equal(50, TargetProgressService.Percent(10, 5));
        Assert.Equal(100, TargetProgressService.Percent(10, 10));
        // 1 of 3 is 33.33, rounds to 33; 2 of 3 is 66.67, rounds to 67.
        Assert.Equal(33, TargetProgressService.Percent(3, 1));
        Assert.Equal(67, TargetProgressService.Percent(3, 2));
    }

    [Fact]
    public void ASingleItemContainerCanReachOneHundred()
    {
        // Deliberately different from ArtistCompletionPercent, which skips
        // one-track artists because it computes every artist automatically.
        // Targets are chosen by hand, so a one-item target is a choice.
        Assert.Equal(100, TargetProgressService.Percent(1, 1));
    }

    [Fact]
    public void TheServiceCanReachTheLibraryAndTheUserData()
    {
        // Play count comes from Jellyfin's own UserItemData, which is what
        // makes "play this 3005 times" work against history that already
        // exists. Losing IUserDataManager here would silently reduce the
        // metric to zero for everyone.
        var constructor = typeof(TargetProgressService).GetConstructors().Single();
        var parameterTypes = constructor.GetParameters().Select(p => p.ParameterType).ToArray();

        Assert.Contains(typeof(ILibraryManager), parameterTypes);
        Assert.Contains(typeof(IUserDataManager), parameterTypes);
        Assert.Contains(typeof(CustomBadgeService), parameterTypes);
        Assert.Contains(typeof(AchievementBadgeService), parameterTypes);
    }

    [Fact]
    public void TheTargetCapHasASaneDefault()
    {
        Assert.Equal(50, new PluginConfiguration().MaxTargetedBadgeTargets);
    }
}
