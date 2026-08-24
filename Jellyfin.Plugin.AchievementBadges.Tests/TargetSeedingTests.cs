using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Api;
using Jellyfin.Plugin.AchievementBadges.Services;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #107. A targeted badge authored today has to count the history a
/// user already has, or it reads zero until someone runs a scan. That is the
/// same complaint issue #24 raised about "Sampler", and the fix is the same
/// shape: give the write path a way to reach the recompute.
/// </summary>
public class TargetSeedingTests
{
    [Fact]
    public void TheCustomBadgeControllerCanReachTheRecompute()
    {
        var constructor = typeof(CustomBadgesController).GetConstructors().Single();

        Assert.Contains(
            constructor.GetParameters(),
            p => p.ParameterType == typeof(TargetProgressService));
    }

    [Fact]
    public void TheRecomputeEndpointCanReachTargets()
    {
        // The endpoint exists precisely so a broken or unwanted scan does not
        // leave the percentages unreachable, which is why 3c23df4 extended it
        // for artists. Targets need the same escape hatch.
        var constructor = typeof(AchievementBadgesController).GetConstructors().Single();

        Assert.Contains(
            constructor.GetParameters(),
            p => p.ParameterType == typeof(TargetProgressService));
    }
}
