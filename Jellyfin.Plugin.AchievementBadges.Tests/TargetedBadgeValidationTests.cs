using System;
using System.Collections.Generic;
using System.IO;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #107. A targeted metric with no target can never unlock, and it
/// fails silently: the badge renders, sits at zero, and nothing logs. Reject
/// it at write time, where the admin is still looking at the form.
/// </summary>
public class TargetedBadgeValidationTests : IDisposable
{
    private readonly string _dataDir;
    private readonly CustomBadgeService _service;

    public TargetedBadgeValidationTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "abvalid_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dataDir);

        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(_dataDir);

        _service = new CustomBadgeService(paths.Object, NullLogger<CustomBadgeService>.Instance);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dataDir, recursive: true); } catch { /* best effort */ }
        GC.SuppressFinalize(this);
    }

    private static CustomBadge BadgeWith(AchievementMetric metric, string? parameter)
    {
        return new CustomBadge
        {
            Name = "Alabasta",
            Criteria = new CustomBadgeCriteria
            {
                Metric = metric,
                MetricParameter = parameter,
                Threshold = 100,
            },
        };
    }

    [Fact]
    public void ATargetedBadgeWithoutATargetIsRejected()
    {
        var ex = Assert.Throws<ArgumentException>(
            () => _service.Upsert(BadgeWith(AchievementMetric.ContainerCompletionPercent, null)));
        Assert.Contains("target", ex.Message, StringComparison.OrdinalIgnoreCase);

        Assert.Throws<ArgumentException>(
            () => _service.Upsert(BadgeWith(AchievementMetric.ItemPlayCount, "   ")));
    }

    [Fact]
    public void ATargetedBadgeInsideACompoundTreeIsCheckedToo()
    {
        // The form only writes leaves, but the API accepts whole trees, and an
        // unreachable leaf buried in an AND is worse than a broken top-level
        // badge: the whole compound silently never fires.
        var badge = new CustomBadge
        {
            Name = "Arc completionist",
            Criteria = new CustomBadgeCriteria
            {
                Operator = CompoundOperator.And,
                Children = new List<CustomBadgeCriteria>
                {
                    new() { Metric = AchievementMetric.MoviesWatched, Threshold = 10 },
                    new() { Metric = AchievementMetric.ContainerCompletionPercent, Threshold = 100 },
                },
            },
        };

        Assert.Throws<ArgumentException>(() => _service.Upsert(badge));
    }

    [Fact]
    public void ATargetedBadgeWithATargetIsAccepted()
    {
        var raw = Guid.NewGuid().ToString("N") + "|One Piece";
        var saved = _service.Upsert(BadgeWith(AchievementMetric.ContainerCompletionPercent, raw));

        Assert.Equal(raw, saved.Criteria.MetricParameter);
    }

    [Fact]
    public void ANameOnlyTargetIsAccepted()
    {
        // Authored through the API before any GUID exists. It resolves on the
        // first recompute; rejecting it would break the documented workflow of
        // POSTing criteria by hand.
        var saved = _service.Upsert(BadgeWith(AchievementMetric.ItemPlayCount, "3005"));

        Assert.Equal("3005", saved.Criteria.MetricParameter);
    }
}
