using System;
using System.IO;
using System.Linq;
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
/// Issue #115. A game session credited through the same RecordPlayback path
/// every other media kind uses. These pin what a session adds to the game
/// counters, what it must not add to (books), and that the parameterised
/// game metrics read those counters the way a custom badge would.
/// </summary>
public class GameAchievementTests : IDisposable
{
    private readonly string _dataDir;
    private readonly AchievementBadgeService _badges;
    private readonly CustomBadgeService _customBadges;

    private static readonly Guid Player = Guid.Parse("99999999-1111-2222-3333-444444444444");
    private static readonly Guid Mario = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
    private static readonly Guid Zelda = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000002");
    private static readonly Guid Sonic = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000003");

    private string PlayerId => Player.ToString("D");

    public GameAchievementTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "abgames_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dataDir);

        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(_dataDir);

        var users = new Mock<IUserManager>();
        users.Setup(m => m.GetUserById(Player)).Returns(new User("Player", "prov", "reset"));

        _customBadges = new CustomBadgeService(paths.Object, NullLogger<CustomBadgeService>.Instance);
        _badges = new AchievementBadgeService(
            paths.Object,
            users.Object,
            new WebhookNotifier(NullLogger<WebhookNotifier>.Instance),
            new AuditLogService(paths.Object, NullLogger<AuditLogService>.Instance),
            NullLogger<AchievementBadgeService>.Instance,
            customBadges: _customBadges);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dataDir, recursive: true); } catch { /* best effort */ }
        GC.SuppressFinalize(this);
    }

    private void Play(Guid game, string platform, long seconds, params string[] studios)
    {
        _badges.RecordPlayback(new PlaybackContext
        {
            UserId = PlayerId,
            ItemId = game.ToString("D"),
            IsGame = true,
            GamePlatform = platform,
            GamePlaySeconds = seconds,
            Studios = studios,
            LibraryName = "Video Games",
            Silent = true
        });
    }

    [Fact]
    public void ASessionFeedsEveryGameCounterAndNoBookCounter()
    {
        Play(Mario, "SNES", 3600, "Nintendo");
        Play(Mario, "SNES", 1800, "Nintendo");
        Play(Zelda, "SNES", 7200, "Nintendo");
        Play(Sonic, "SegaGenesis", 600, "Sega", "Sega Technical Institute");

        var c = _badges.PeekProfile(PlayerId)!.Counters;
        Assert.Equal(4, c.GamePlays);
        Assert.Equal(13200, c.GamePlaySeconds);
        Assert.Equal(3, c.GamePlayHours);
        Assert.Equal(3, c.UniqueGamesPlayed);
        Assert.Equal(2, c.UniqueGamePlatforms);
        Assert.Equal(5400, c.GameSecondsByItem[Mario.ToString("N")]);
        Assert.Equal(2, c.GamesByPlatform["SNES"].Count);
        Assert.Equal(2, c.GamesByStudio["Nintendo"].Count);
        Assert.Equal(1, c.GamesByStudio["Sega Technical Institute"].Count);

        // The item is a Book in Jellyfin's eyes. It must not read as one here.
        Assert.Equal(0, c.BooksCompleted);
    }

    [Fact]
    public void AnUnknownPlatformIsNotAPlatform()
    {
        Play(Mario, "Unknown", 3600);
        Play(Zelda, null!, 3600);

        var c = _badges.PeekProfile(PlayerId)!.Counters;
        Assert.Equal(2, c.UniqueGamesPlayed);
        Assert.Equal(0, c.UniqueGamePlatforms);
    }

    [Fact]
    public void TheGameMetricsAreAppendedAtTheEndOfTheEnum()
    {
        var values = (AchievementMetric[])Enum.GetValues(typeof(AchievementMetric));
        var last = values.Skip(values.Length - 7).ToArray();

        Assert.Equal(
            new[]
            {
                AchievementMetric.GamePlays, AchievementMetric.GamePlayHours, AchievementMetric.UniqueGamesPlayed,
                AchievementMetric.UniqueGamePlatforms, AchievementMetric.GamePlatformGames, AchievementMetric.GameStudioGames,
                AchievementMetric.GameHours
            },
            last);
        Assert.Equal(AchievementMetric.ItemPlayCount, values[^8]);
    }

    [Fact]
    public void ParameterisedGameMetricsUnlockCustomBadges()
    {
        // The reporter's own wording: "You've played X games by Developer",
        // plus hours in one specific game, both as custom badges. The platform
        // parameter is matched case-insensitively, like music genres.
        _customBadges.Upsert(new CustomBadge
        {
            Id = "sega-fan",
            Name = "Sega Fan",
            Criteria = new CustomBadgeCriteria { Metric = AchievementMetric.GamePlatformGames, MetricParameter = "segagenesis", Threshold = 2 }
        });
        _customBadges.Upsert(new CustomBadge
        {
            Id = "nintendo-two",
            Name = "Two by Nintendo",
            Criteria = new CustomBadgeCriteria { Metric = AchievementMetric.GameStudioGames, MetricParameter = "Nintendo", Threshold = 2 }
        });
        _customBadges.Upsert(new CustomBadge
        {
            Id = "mario-hour",
            Name = "An hour of Mario",
            Criteria = new CustomBadgeCriteria { Metric = AchievementMetric.GameHours, MetricParameter = Mario.ToString("N") + "|Super Mario World", Threshold = 1 }
        });

        Play(Mario, "SNES", 1800, "Nintendo");
        Play(Zelda, "SNES", 600, "Nintendo");
        Play(Sonic, "SegaGenesis", 600, "Sega");

        var badges = _badges.PeekProfile(PlayerId)!.Badges;
        Assert.True(badges.Single(b => b.Id == "nintendo-two").Unlocked);
        Assert.False(badges.Single(b => b.Id == "sega-fan").Unlocked);
        Assert.False(badges.Single(b => b.Id == "mario-hour").Unlocked);

        Play(Mario, "SNES", 1800, "Nintendo");
        Assert.True(_badges.PeekProfile(PlayerId)!.Badges.Single(b => b.Id == "mario-hour").Unlocked);
    }
}
