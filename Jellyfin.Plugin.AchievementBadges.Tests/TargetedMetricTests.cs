using System;
using System.Collections.Generic;
using System.IO;
using Jellyfin.Database.Implementations.Entities;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #107. Targeted metrics read a per-target dictionary keyed by the
/// target's GUID, the same shape LibraryCompletionPercents and
/// ArtistCompletionPercents already use. These pin the two behaviours that
/// the artist path had to learn the hard way: the scoped writer merges rather
/// than replaces, and an unresolved parameter reads as zero instead of
/// throwing.
/// </summary>
public class TargetedMetricTests : IDisposable
{
    private readonly string _dataDir;
    private readonly AchievementBadgeService _badges;

    private static readonly Guid Viewer = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid SeriesTarget = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444");
    private static readonly Guid OtherTarget = Guid.Parse("bbbbbbbb-1111-2222-3333-444444444444");

    private string ViewerId => Viewer.ToString("D");

    public TargetedMetricTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "abtarget_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dataDir);

        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(_dataDir);

        var users = new Mock<IUserManager>();
        users.Setup(m => m.GetUserById(Viewer)).Returns(new User("Viewer", "prov", "reset"));

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
    public void TheNewMetricsAreAppendedAtTheEndOfTheEnum()
    {
        // Ordinals are serialized. Inserting these anywhere but the end
        // silently reinterprets every stored badge definition past the
        // insertion point.
        var values = (AchievementMetric[])Enum.GetValues(typeof(AchievementMetric));

        Assert.Equal(AchievementMetric.ItemPlayCount, values[^1]);
        Assert.Equal(AchievementMetric.ContainerCompletionPercent, values[^2]);
        Assert.Equal(AchievementMetric.ArtistCompletionPercent, values[^3]);
    }

    [Fact]
    public void PercentagesRoundTripThroughTheCounters()
    {
        var counters = new UserAchievementCounters();
        Assert.Empty(counters.ContainerCompletionPercents);
        Assert.Empty(counters.ItemPlayCounts);

        counters.ContainerCompletionPercents[SeriesTarget.ToString("N")] = 100;
        counters.ItemPlayCounts[OtherTarget.ToString("N")] = 3005;

        Assert.Equal(100, counters.ContainerCompletionPercents[SeriesTarget.ToString("N")]);
        Assert.Equal(3005, counters.ItemPlayCounts[OtherTarget.ToString("N")]);
    }

    [Fact]
    public void MergePreservesTargetsItWasNotAskedAbout()
    {
        // The exact defect replace semantics would cause: finish one episode
        // of one series, lose the percentage the last scan computed for every
        // other target.
        _badges.MergeContainerCompletionPercents(ViewerId, new Dictionary<string, int>
        {
            [SeriesTarget.ToString("N")] = 40,
            [OtherTarget.ToString("N")] = 90,
        });

        _badges.MergeContainerCompletionPercents(ViewerId, new Dictionary<string, int>
        {
            [SeriesTarget.ToString("N")] = 60,
        });

        var counters = _badges.PeekProfile(ViewerId)!.Counters;
        Assert.Equal(60, counters.ContainerCompletionPercents[SeriesTarget.ToString("N")]);
        Assert.Equal(90, counters.ContainerCompletionPercents[OtherTarget.ToString("N")]);
    }

    [Fact]
    public void MergingNothingDoesNotDisturbStoredProgress()
    {
        _badges.MergeItemPlayCounts(ViewerId, new Dictionary<string, int>
        {
            [OtherTarget.ToString("N")] = 12,
        });

        _badges.MergeItemPlayCounts(ViewerId, new Dictionary<string, int>());

        Assert.Equal(12, _badges.PeekProfile(ViewerId)!.Counters.ItemPlayCounts[OtherTarget.ToString("N")]);
    }
}
