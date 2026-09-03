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
/// Issue #42, follow-up: the shop sells a custom title and a badge frame that
/// only the owner could see, because neither the shareable card nor the
/// friends-drawer summary read them. These pin the projection that fixes it,
/// and the two properties that keep it safe: it resolves against the catalog
/// (a stale id becomes nothing, not markup) and it obeys the same privacy
/// toggles as the equipped badge preview.
/// </summary>
public class PublicCosmeticsTests : IDisposable
{
    private readonly string _dataDir;
    private readonly Mock<IApplicationPaths> _paths;
    private readonly AchievementBadgeService _badges;

    private const string Target = "88888888-8888-8888-8888-888888888888";

    public PublicCosmeticsTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "abcosm_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dataDir);

        _paths = new Mock<IApplicationPaths>();
        _paths.SetupGet(p => p.PluginConfigurationsPath).Returns(_dataDir);

        _badges = Build(withShop: true);
    }

    private AchievementBadgeService Build(bool withShop)
    {
        var shop = withShop
            ? new ShopService(new PowerUpService(NullLogger<PowerUpService>.Instance), NullLogger<ShopService>.Instance)
            : null;

        return new AchievementBadgeService(
            _paths.Object,
            new Mock<IUserManager>().Object,
            new WebhookNotifier(NullLogger<WebhookNotifier>.Instance),
            new AuditLogService(_paths.Object, NullLogger<AuditLogService>.Instance),
            NullLogger<AchievementBadgeService>.Instance,
            shop: shop);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dataDir, recursive: true); } catch { /* best effort */ }
        GC.SuppressFinalize(this);
    }

    private static void Seed(AchievementBadgeService badges, string? titleId, string? frameId)
    {
        badges.RecordPlayback(new PlaybackContext
        {
            UserId = Target,
            ItemId = Guid.NewGuid().ToString("D"),
            IsMovie = true,
            Silent = true
        });

        var profile = badges.GetOrCreateProfileDirect(Target);
        profile.EquippedCustomTitleId = titleId;
        profile.EquippedBadgeFrameId = frameId;
        badges.SaveProfileDirect(profile);
    }

    [Fact]
    public void EquippedTitleAndFrame_ReachTheCardAndTheSummary()
    {
        // The reporter's exact case: bought "Tastemaker" and "Gilded", nobody
        // else could see either.
        Seed(_badges, "title-tastemaker", "frame-gilded");

        var card = _badges.GetPublicCosmetics(Target);
        Assert.Equal("Tastemaker", card.CustomTitle);
        Assert.Equal("frame-gilded", card.BadgeFrameId);

        var summary = _badges.GetPublicProfileSummary(Target);
        Assert.NotNull(summary);
        Assert.Equal("Tastemaker", summary!.GetType().GetProperty("CustomTitle")!.GetValue(summary));
        Assert.Equal("frame-gilded", summary.GetType().GetProperty("BadgeFrameId")!.GetValue(summary));
    }

    [Fact]
    public void AHiddenShowcase_HidesTheBlingToo()
    {
        // The card must never show more than the equipped preview does. A user
        // who turned the showcase off gets a plain card, title and frame
        // included.
        Seed(_badges, "title-tastemaker", "frame-gilded");
        var profile = _badges.GetOrCreateProfileDirect(Target);
        profile.Preferences.ShowEquippedShowcase = false;
        _badges.SaveProfileDirect(profile);

        var card = _badges.GetPublicCosmetics(Target);
        Assert.Null(card.CustomTitle);
        Assert.Null(card.BadgeFrameId);
    }

    [Fact]
    public void TheDefaultFrameAndAnUnknownTitle_ReadAsNothing()
    {
        // frame-default is what everyone has, so it is not bling. An id the
        // catalog does not know (renamed, removed, hand-edited) must become
        // nothing rather than a CSS class or a title in the markup.
        Seed(_badges, "title-does-not-exist", "frame-default");

        var card = _badges.GetPublicCosmetics(Target);
        Assert.Null(card.CustomTitle);
        Assert.Null(card.BadgeFrameId);
    }

    [Fact]
    public void AFrameIdOfAnotherKind_IsNotAcceptedAsAFrame()
    {
        // The frame id becomes a CSS class on the card, so it can only ever
        // be an id the catalog lists as a frame, not any catalog id.
        Seed(_badges, null, "title-tastemaker");

        Assert.Null(_badges.GetPublicCosmetics(Target).BadgeFrameId);
    }

    [Fact]
    public void WithoutAShop_NothingShowsAndNothingThrows()
    {
        // ShopService is an optional dependency of the badge service.
        var badges = Build(withShop: false);
        Seed(badges, "title-tastemaker", "frame-gilded");

        var card = badges.GetPublicCosmetics(Target);
        Assert.Null(card.CustomTitle);
        Assert.Null(card.BadgeFrameId);
    }

    [Fact]
    public void AnUnknownUser_ReadsAsNothing()
    {
        // Same shape as the public summary: no way to tell an unknown id from
        // a hidden one.
        var card = _badges.GetPublicCosmetics("99999999-9999-9999-9999-999999999999");
        Assert.Null(card.CustomTitle);
        Assert.Null(card.BadgeFrameId);
    }
}
