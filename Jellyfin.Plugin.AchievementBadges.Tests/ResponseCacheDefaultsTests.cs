using System;
using System.Reflection;
using Jellyfin.Plugin.AchievementBadges.Api;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Pins the cache policy of the controllers that return per-user, constantly
/// changing JSON. Without an explicit directive these responses carry no
/// freshness information at all, which lets a browser or an intermediary
/// apply heuristic caching and serve one user's stale profile, friends list
/// or quest state for an unbounded amount of time.
/// </summary>
public class ResponseCacheDefaultsTests
{
    [Theory]
    [InlineData(typeof(AchievementBadgesController))]
    [InlineData(typeof(CustomBadgesController))]
    [InlineData(typeof(TimeWindowedAdminController))]
    public void DynamicControllers_DefaultToNoStore(Type controller)
    {
        var attribute = controller.GetCustomAttribute<ResponseCacheAttribute>();

        Assert.NotNull(attribute);
        Assert.True(attribute!.NoStore);
    }
}
