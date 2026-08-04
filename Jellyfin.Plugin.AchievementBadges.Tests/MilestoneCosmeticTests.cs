using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Regression tests for issue #55. Milestone cosmetics used to be granted with
/// no signal of any kind, so the only way to discover a title earned over
/// months of play was to notice it later sitting in the inventory.
/// <para>
/// <c>CheckMilestones</c> now reports what it granted on each call, which is
/// what lets the caller announce it. These tests pin the two properties that
/// make that safe to act on: it reports only what is new, and it reports
/// nothing on a repeat call.
/// </para>
/// </summary>
public class MilestoneCosmeticTests
{
    private static ShopService NewShop()
        => new(new PowerUpService(NullLogger<PowerUpService>.Instance), NullLogger<ShopService>.Instance);

    private static UserAchievementProfile NewProfile()
        => new() { UserId = "11111111-1111-1111-1111-111111111111" };

    [Fact]
    public void ReportsOnlyWhatItGranted()
    {
        var shop = NewShop();
        var profile = NewProfile();

        var granted = shop.CheckMilestones(profile, 2600);

        var ids = granted.Select(c => c.Id).ToList();
        Assert.Contains("title-cinephile", ids);   // 1000
        Assert.Contains("title-marathoner", ids);  // 2500
        Assert.DoesNotContain("title-curator", ids); // 5000, not reached

        // Everything reported must actually be owned now.
        Assert.All(granted, c => Assert.Contains(c.Id, profile.OwnedCosmetics));
    }

    [Fact]
    public void ReportsNothingOnRepeatCall()
    {
        var shop = NewShop();
        var profile = NewProfile();

        var first = shop.CheckMilestones(profile, 5000);
        Assert.NotEmpty(first);

        var second = shop.CheckMilestones(profile, 5000);

        // Without this, every rebuild would announce the same titles again.
        // The user-visible symptom on the instance that prompted the issue was
        // 21 grant log lines for 4 distinct titles.
        Assert.Empty(second);
    }

    [Fact]
    public void ReportsNothingBelowTheFirstThreshold()
    {
        var shop = NewShop();
        var profile = NewProfile();

        Assert.Empty(shop.CheckMilestones(profile, 999));
    }

    [Fact]
    public void GrantedCosmeticsCarryWhatAnAnnouncementNeeds()
    {
        var shop = NewShop();
        var profile = NewProfile();

        var cosmetic = shop.CheckMilestones(profile, 1000).Single(c => c.Id == "title-cinephile");

        Assert.False(string.IsNullOrWhiteSpace(cosmetic.DisplayName));
        Assert.NotNull(cosmetic.MilestoneScore);
    }
}
