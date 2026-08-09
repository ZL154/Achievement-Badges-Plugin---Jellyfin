using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Jellyfin.Plugin.AchievementBadges.Api;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Library;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #42: the friends drawer can show another user's summary card.
/// These pin the part that matters, which is that it cannot become a way to
/// see someone who chose not to be seen, or to discover which user ids exist.
/// </summary>
public class PublicProfileSummaryTests : IDisposable
{
    private readonly string _dataDir;
    private readonly AchievementBadgeService _badges;

    private const string Target = "66666666-6666-6666-6666-666666666666";

    public PublicProfileSummaryTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "abprofile_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dataDir);

        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(_dataDir);

        _badges = new AchievementBadgeService(
            paths.Object,
            new Mock<IUserManager>().Object,
            new WebhookNotifier(NullLogger<WebhookNotifier>.Instance),
            new AuditLogService(paths.Object, NullLogger<AuditLogService>.Instance),
            NullLogger<AchievementBadgeService>.Instance);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dataDir, recursive: true); } catch { /* best effort */ }
        GC.SuppressFinalize(this);
    }

    private void SeedTarget()
    {
        _badges.RecordPlayback(new PlaybackContext
        {
            UserId = Target,
            ItemId = Guid.NewGuid().ToString("D"),
            IsMovie = true,
            Silent = true
        });
    }

    [Fact]
    public void UnknownUser_IsIndistinguishableFromAHiddenOne()
    {
        // Both answer null, so the endpoint's 404 cannot be used to work out
        // which user ids exist on the server.
        Assert.Null(_badges.GetPublicProfileSummary("77777777-7777-7777-7777-777777777777"));

        SeedTarget();
        var profile = _badges.GetOrCreateProfileDirect(Target);
        profile.Preferences.HideFromLeaderboard = true;
        _badges.SaveProfileDirect(profile);

        Assert.Null(_badges.GetPublicProfileSummary(Target));
    }

    [Fact]
    public void OptedInUser_ReturnsTheLeaderboardProjection_AndNothingMore()
    {
        SeedTarget();

        var summary = _badges.GetPublicProfileSummary(Target);
        Assert.NotNull(summary);

        // The whole privacy argument rests on this: the card can only ever
        // show what the leaderboard already publishes. If a field is added
        // here without being added there, this fails.
        var expected = new[]
        {
            "UserId", "UserName", "Unlocked", "Total", "Percentage",
            "Score", "BestWatchStreak", "Equipped"
        };
        var actual = summary!.GetType().GetProperties().Select(p => p.Name).OrderBy(n => n).ToArray();

        Assert.Equal(expected.OrderBy(n => n).ToArray(), actual);
    }

    [Fact]
    public void HidingFromTheLeaderboardAlsoHidesTheCard()
    {
        SeedTarget();
        Assert.NotNull(_badges.GetPublicProfileSummary(Target));

        var profile = _badges.GetOrCreateProfileDirect(Target);
        profile.Preferences.HideFromLeaderboard = true;
        _badges.SaveProfileDirect(profile);

        Assert.Null(_badges.GetPublicProfileSummary(Target));
    }

    [Fact]
    public void Route_UsesTargetUserId_SoTheOwnershipFilterDoesNotBlockIt()
    {
        // UserOwnershipFilter keys on a route parameter literally named
        // "userId" and forbids anyone but that user. A summary route named
        // that way would 403 for every caller, which is exactly the bug this
        // naming avoids, and it is not obvious from the method alone.
        var method = typeof(AchievementBadgesController)
            .GetMethod(nameof(AchievementBadgesController.GetPublicProfileSummary));
        Assert.NotNull(method);

        var route = method!.GetCustomAttribute<HttpGetAttribute>();
        Assert.NotNull(route);
        Assert.Equal("profiles/{targetUserId}/summary", route!.Template);
        Assert.DoesNotContain("{userId}", route.Template, StringComparison.Ordinal);
    }

    [Fact]
    public void Sidebar_MarksTheHoverTargetsAndCallsTheEndpoint()
    {
        var assembly = typeof(Plugin).Assembly;
        var name = assembly.GetManifestResourceNames().Single(n => n.EndsWith("sidebar.js", StringComparison.Ordinal));
        using var stream = assembly.GetManifestResourceStream(name)!;
        using var reader = new StreamReader(stream);
        var js = reader.ReadToEnd();

        Assert.Contains("data-ab-profile", js);
        Assert.Contains("/summary", js);
        // Keyboard reachable: hover alone would leave the card unreachable
        // without a pointer.
        Assert.Contains("tabindex=\\\"0\\\" role=\\\"button\\\"", js.Replace("\"", "\\\""));
    }
}
