using System;
using System.Collections;
using System.IO;
using System.Reflection;
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
/// v2.3.1: deleting a Jellyfin account does not delete its achievement profile,
/// so stale profiles linger in the store. They must not appear in any public
/// projection — a deleted account used to show on the leaderboard as its raw
/// GUID (no username left to resolve) and inflate the server user count.
/// </summary>
public class DeletedUserExclusionTests : IDisposable
{
    private readonly string _dataDir;
    private readonly AchievementBadgeService _badges;

    private static readonly Guid Live = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid Deleted = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public DeletedUserExclusionTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "abdel_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dataDir);

        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(_dataDir);

        // Live account resolves to a user; the deleted one resolves to null,
        // exactly as IUserManager behaves after the account is removed.
        var users = new Mock<IUserManager>();
        users.Setup(m => m.GetUserById(Live)).Returns(new User("Alice", "prov", "reset"));
        users.Setup(m => m.GetUserById(Deleted)).Returns((User?)null);

        _badges = new AchievementBadgeService(
            paths.Object,
            users.Object,
            new WebhookNotifier(NullLogger<WebhookNotifier>.Instance),
            new AuditLogService(paths.Object, NullLogger<AuditLogService>.Instance),
            NullLogger<AchievementBadgeService>.Instance);

        Seed(Live);
        Seed(Deleted);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dataDir, recursive: true); } catch { /* best effort */ }
        GC.SuppressFinalize(this);
    }

    private void Seed(Guid userId) => _badges.RecordPlayback(new PlaybackContext
    {
        UserId = userId.ToString("D"),
        ItemId = Guid.NewGuid().ToString("D"),
        IsMovie = true,
        Silent = true
    });

    [Fact]
    public void ServerStats_CountsOnlyLiveAccounts()
    {
        dynamic stats = _badges.GetServerStats();
        Assert.Equal(1, (int)stats.TotalUsers);
    }

    [Fact]
    public void Leaderboard_ExcludesDeletedAccount()
    {
        var deletedKey = Deleted.ToString("D");
        var liveKey = Live.ToString("D");
        var seenLive = false;

        foreach (var entry in (IEnumerable)_badges.GetLeaderboard(50))
        {
            var uid = (string)entry.GetType().GetProperty("UserId")!.GetValue(entry)!;
            Assert.NotEqual(deletedKey, uid);   // the deleted GUID must never surface
            if (string.Equals(uid, liveKey, StringComparison.OrdinalIgnoreCase)) seenLive = true;
        }

        Assert.True(seenLive, "the live account should still be on the leaderboard");
    }
}
