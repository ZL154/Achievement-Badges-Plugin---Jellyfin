using System;
using System.IO;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// The profile store is keyed by the hyphenated GUID form, and every entry
/// point normalises its argument before touching it. <c>GetOrCreateProfile</c>
/// did not, so a caller passing the compact form ("N", no hyphens) missed the
/// live profile and created an empty one beside it. The duplicates collapse on
/// the next load, where the empty twin can replace real progress.
/// <para>
/// The compact form is not hypothetical: <c>FriendsService</c> hands out ids as
/// <c>Id.ToString("N")</c>, <c>MessagingService</c> converts to the same form,
/// and the client strips hyphens before sending them back, so the create-on-
/// demand path behind the friends panel hits it in normal use.
/// </para>
/// </summary>
public class ProfileKeyNormalizationTests : IDisposable
{
    private readonly string _dataDir;
    private readonly AchievementBadgeService _badges;

    public ProfileKeyNormalizationTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "abkey_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dataDir);

        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(_dataDir);

        var userManager = new Mock<IUserManager>().Object;
        var webhook = new WebhookNotifier(NullLogger<WebhookNotifier>.Instance);
        var audit = new AuditLogService(paths.Object, NullLogger<AuditLogService>.Instance);

        _badges = new AchievementBadgeService(
            paths.Object, userManager, webhook, audit,
            NullLogger<AchievementBadgeService>.Instance);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dataDir, recursive: true); } catch { /* best effort */ }
        GC.SuppressFinalize(this);
    }

    private const string Hyphenated = "33333333-3333-3333-3333-333333333333";

    [Fact]
    public void CompactGuid_ReachesTheSameProfile_InsteadOfCreatingAnEmptyTwin()
    {
        var compact = Hyphenated.Replace("-", string.Empty, StringComparison.Ordinal);

        _badges.RecordPlayback(new PlaybackContext
        {
            UserId = Hyphenated,
            ItemId = Guid.NewGuid().ToString("D"),
            IsMovie = true,
            Silent = true
        });

        var watched = _badges.PeekProfile(Hyphenated)!.Counters.TotalItemsWatched;
        Assert.True(watched > 0);

        // The friends panel path: create-on-demand with the compact id.
        var viaCompact = _badges.GetOrCreateProfileDirect(compact);

        Assert.Equal(watched, viaCompact.Counters.TotalItemsWatched);
        Assert.Equal(Hyphenated, viaCompact.UserId);

        // And the original profile must be untouched, not shadowed by a twin.
        Assert.Equal(watched, _badges.PeekProfile(Hyphenated)!.Counters.TotalItemsWatched);
    }

    [Fact]
    public void UppercaseAndBracedForms_AlsoReachTheSameProfile()
    {
        _badges.RecordPlayback(new PlaybackContext
        {
            UserId = Hyphenated,
            ItemId = Guid.NewGuid().ToString("D"),
            IsMovie = true,
            Silent = true
        });

        var watched = _badges.PeekProfile(Hyphenated)!.Counters.TotalItemsWatched;

        foreach (var variant in new[] { Hyphenated.ToUpperInvariant(), "{" + Hyphenated + "}" })
        {
            var profile = _badges.GetOrCreateProfileDirect(variant);
            Assert.Equal(watched, profile.Counters.TotalItemsWatched);
            Assert.Equal(Hyphenated, profile.UserId);
        }
    }
}
