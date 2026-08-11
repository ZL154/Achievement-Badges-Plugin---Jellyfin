using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Jellyfin.Database.Implementations.Entities;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #24 follow-up: discography percentages were computed by exactly one
/// writer, the full recompute, whose only caller was the watch history scan.
/// Listening to an album live never moved them, so "Sampler" (hear 10% of one
/// artist) could not unlock without an admin running a scan. These pin the
/// live path: the scoped recompute must MERGE into the stored map, because
/// replace semantics there would wipe every other artist on each play.
/// </summary>
public class ArtistCompletionLiveRecomputeTests : IDisposable
{
    private readonly string _dataDir;
    private readonly AchievementBadgeService _badges;

    private static readonly Guid Listener = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private string ListenerId => Listener.ToString("D");

    public ArtistCompletionLiveRecomputeTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "ablive_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dataDir);

        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(_dataDir);

        var users = new Mock<IUserManager>();
        users.Setup(m => m.GetUserById(Listener)).Returns(new User("Listener", "prov", "reset"));

        _badges = new AchievementBadgeService(
            paths.Object,
            users.Object,
            new WebhookNotifier(NullLogger<WebhookNotifier>.Instance),
            new AuditLogService(paths.Object, NullLogger<AuditLogService>.Instance),
            NullLogger<AchievementBadgeService>.Instance);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dataDir, recursive: true); } catch { /* best effort */ }
        GC.SuppressFinalize(this);
    }

    [Fact]
    public void MergePreservesArtistsItWasNotAskedAbout()
    {
        // The exact defect a replace would cause: play one Underscores track,
        // lose the Aphex Twin percentage the last scan computed.
        _badges.UpdateArtistCompletionPercents(ListenerId, new Dictionary<string, int>
        {
            ["Aphex Twin"] = 95,
            ["Underscores"] = 40,
        });

        _badges.MergeArtistCompletionPercents(ListenerId, new Dictionary<string, int>
        {
            ["Underscores"] = 50,
        });

        var counters = _badges.PeekProfile(ListenerId)!.Counters;
        Assert.Equal(95, counters.ArtistCompletionPercents["Aphex Twin"]);
        Assert.Equal(50, counters.ArtistCompletionPercents["Underscores"]);
    }

    [Fact]
    public void MergeUnlocksTheBadgeTheIssueWasAbout()
    {
        // Crossing 10% through the live path must behave exactly like
        // crossing it through a scan: evaluate and unlock immediately.
        // 30 sits between the Regular Listener (25) and Fan (50) rungs.
        _badges.MergeArtistCompletionPercents(ListenerId, new Dictionary<string, int>
        {
            ["Underscores"] = 30,
        });

        var profile = _badges.PeekProfile(ListenerId)!;
        var unlocked = profile.Badges.Where(b => b.Unlocked).Select(b => b.Id).ToList();
        Assert.Contains("artist-sampler", unlocked);
        Assert.Contains("artist-listener", unlocked);
        Assert.DoesNotContain("artist-fan", unlocked);
    }

    [Fact]
    public void MergeWithNothingToSayTouchesNothing()
    {
        // A track whose artists resolve to no MusicArtist item (or all under
        // the 2-track floor) produces an empty result. That must be a no-op,
        // not a profile write.
        _badges.MergeArtistCompletionPercents(ListenerId, new Dictionary<string, int>());
        Assert.Null(_badges.PeekProfile(ListenerId));
    }

    [Fact]
    public void TheTrackerCanReachTheCompletionService()
    {
        // Same shape as LibraryCompletionWiringTests, and the same honesty
        // about it: this pins the dependency, not the call. Exercising the
        // call needs Jellyfin's event stack; the evidence for it is the live
        // validation recorded in the PR.
        var constructor = typeof(PlaybackCompletionTracker)
            .GetConstructors()
            .Single();

        Assert.Contains(
            constructor.GetParameters(),
            p => p.ParameterType == typeof(LibraryCompletionService));
    }
}
