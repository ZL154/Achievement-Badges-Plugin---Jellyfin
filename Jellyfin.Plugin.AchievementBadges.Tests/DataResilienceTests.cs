using System;
using System.IO;
using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Configuration;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Data resilience tests, the completion of issue #48. PR #51 made the
/// scan keep everything a rebuild cannot reconstruct; these pin the two
/// remaining loss windows closed:
/// <list type="bullet">
/// <item>counter monotonicity: a watch history rebuild floors every lifetime
/// counter at its pre scan value, so media deleted since it was watched can
/// never shrink totals;</item>
/// <item>daily snapshots: the service keeps dated copies of badges.json under
/// {pluginData}/backups with retention pruning, so an accidental scan or a
/// corrupted write can be rolled back days later, not only minutes.</item>
/// </list>
/// </summary>
public class DataResilienceTests : IDisposable
{
    private readonly string _dataDir;
    private readonly AchievementBadgeService _badges;

    public DataResilienceTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "abfork_" + Guid.NewGuid().ToString("N"));
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

    private const string UserId = "22222222-2222-2222-2222-222222222222";

    [Fact]
    public void CounterFloor_NumericTotals_NeverGoBackwards()
    {
        var previous = new UserAchievementCounters
        {
            MoviesWatched = 33,
            TotalItemsWatched = 598,
            TotalMinutesWatched = 31008,
            BestWatchStreak = 9,
            LongestItemMinutes = 240
        };
        var rebuilt = new UserAchievementCounters
        {
            MoviesWatched = 5,
            TotalItemsWatched = 40,
            TotalMinutesWatched = 900,
            BestWatchStreak = 12,
            LongestItemMinutes = 100
        };

        CounterFloor.Apply(previous, rebuilt);

        Assert.Equal(33, rebuilt.MoviesWatched);
        Assert.Equal(598, rebuilt.TotalItemsWatched);
        Assert.Equal(31008, rebuilt.TotalMinutesWatched);
        Assert.Equal(240, rebuilt.LongestItemMinutes);
        // A rebuild that found MORE keeps its own larger value.
        Assert.Equal(12, rebuilt.BestWatchStreak);
    }

    [Fact]
    public void CounterFloor_FlagsSetsDictsAndDates_MergeMonotonically()
    {
        var previous = new UserAchievementCounters
        {
            WatchedOnChristmas = true,
            LastWatchDate = new DateOnly(2026, 7, 30)
        };
        previous.GenresWatched.Add("Drama");
        previous.GenresWatched.Add("Horror");
        previous.DecadesWatched.Add(1980);
        previous.GenreItemCounts["Drama"] = 25;
        previous.GenreItemCounts["Horror"] = 4;
        previous.MusicGenreListeningSeconds["Jazz"] = 7200;

        var rebuilt = new UserAchievementCounters
        {
            WatchedOnChristmas = false,
            LastWatchDate = new DateOnly(2026, 6, 1)
        };
        rebuilt.GenresWatched.Add("Drama");
        rebuilt.GenresWatched.Add("Comedy");
        rebuilt.GenreItemCounts["Drama"] = 3;
        rebuilt.GenreItemCounts["Comedy"] = 8;

        CounterFloor.Apply(previous, rebuilt);

        Assert.True(rebuilt.WatchedOnChristmas);
        Assert.Equal(new DateOnly(2026, 7, 30), rebuilt.LastWatchDate);
        Assert.Superset(new[] { "Drama", "Horror", "Comedy" }.ToHashSet(), rebuilt.GenresWatched);
        Assert.Contains(1980, rebuilt.DecadesWatched);
        Assert.Equal(25, rebuilt.GenreItemCounts["Drama"]);
        Assert.Equal(4, rebuilt.GenreItemCounts["Horror"]);
        Assert.Equal(8, rebuilt.GenreItemCounts["Comedy"]);
        Assert.Equal(7200, rebuilt.MusicGenreListeningSeconds["Jazz"]);
    }

    [Fact]
    public void CounterFloor_PerKeySets_UnionPerKey()
    {
        // Issue #115. A game session leaves no played flag behind, so a
        // watch history rebuild produces empty game sets. Before the floor
        // learned this shape, one scan wiped every platform and studio a
        // player had touched while the plain totals next to them survived.
        var previous = new UserAchievementCounters { GamePlays = 12, GamePlaySeconds = 5400 };
        previous.GamesByPlatform["SNES"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "mario", "zelda" };
        previous.GamesByPlatform["SegaGenesis"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "sonic" };
        previous.GamesByStudio["Nintendo"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "mario", "zelda" };

        var rebuilt = new UserAchievementCounters();
        rebuilt.GamesByPlatform["SNES"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "metroid" };

        CounterFloor.Apply(previous, rebuilt);

        Assert.Equal(12, rebuilt.GamePlays);
        Assert.Equal(5400, rebuilt.GamePlaySeconds);
        Assert.Equal(2, rebuilt.UniqueGamePlatforms);
        Assert.Equal(new[] { "mario", "metroid", "zelda" }, rebuilt.GamesByPlatform["SNES"].OrderBy(g => g).ToArray());
        Assert.Equal(new[] { "sonic" }, rebuilt.GamesByPlatform["SegaGenesis"].ToArray());
        // The copied set keeps its comparer, so the case-insensitive lookup still works.
        Assert.True(rebuilt.GamesByPlatform["SegaGenesis"].Contains("SONIC"));
        Assert.Equal(2, rebuilt.GamesByStudio["Nintendo"].Count);
    }

    [Fact]
    public void Service_SnapshotAndFloor_RoundTripThroughProfile()
    {
        Assert.Null(_badges.SnapshotCountersForUser(UserId));

        // Create the profile with one genuine playback.
        _badges.RecordPlayback(new PlaybackContext
        {
            UserId = UserId,
            ItemId = Guid.NewGuid().ToString("D"),
            IsMovie = true,
            Silent = true
        });

        var snapshot = _badges.SnapshotCountersForUser(UserId);
        Assert.NotNull(snapshot);

        // Simulate the state a scan against a shrunken library would leave by
        // flooring with a snapshot that is far ahead of the live counters.
        snapshot!.MoviesWatched = 33;
        snapshot.TotalMinutesWatched = 31008;
        _badges.ApplyCounterFloor(UserId, snapshot);

        var counters = _badges.PeekProfile(UserId)!.Counters;
        Assert.Equal(33, counters.MoviesWatched);
        Assert.Equal(31008, counters.TotalMinutesWatched);

        // Null snapshot (fresh user before the scan) is a clean no op.
        _badges.ApplyCounterFloor(UserId, null);
        Assert.Equal(33, _badges.PeekProfile(UserId)!.Counters.MoviesWatched);
    }

    [Fact]
    public void DailySnapshot_WritesOncePerDay_AndPrunesByFileNameDate()
    {
        var dataFile = Path.Combine(_dataDir, "snapshot-test", "badges.json");
        Directory.CreateDirectory(Path.GetDirectoryName(dataFile)!);
        File.WriteAllText(dataFile, "{\"state\":\"day one\"}");

        var backups = Path.Combine(Path.GetDirectoryName(dataFile)!, "backups");
        var today = new DateOnly(2026, 8, 1);

        AchievementBadgeService.WriteDailySnapshotCore(dataFile, today, 14);
        var snapshotPath = Path.Combine(backups, "badges-2026-08-01.json");
        Assert.Equal("{\"state\":\"day one\"}", File.ReadAllText(snapshotPath));

        // Second save the same day must not overwrite the day's snapshot.
        File.WriteAllText(dataFile, "{\"state\":\"day one, later\"}");
        AchievementBadgeService.WriteDailySnapshotCore(dataFile, today, 14);
        Assert.Equal("{\"state\":\"day one\"}", File.ReadAllText(snapshotPath));

        // Pruning: a snapshot older than the window dies, a recent one and a
        // foreign file survive.
        File.WriteAllText(Path.Combine(backups, "badges-2026-07-01.json"), "{}");
        File.WriteAllText(Path.Combine(backups, "badges-2026-07-25.json"), "{}");
        File.WriteAllText(Path.Combine(backups, "not-a-snapshot.json"), "{}");
        AchievementBadgeService.WriteDailySnapshotCore(dataFile, new DateOnly(2026, 8, 2), 14);

        Assert.False(File.Exists(Path.Combine(backups, "badges-2026-07-01.json")));
        Assert.True(File.Exists(Path.Combine(backups, "badges-2026-07-25.json")));
        Assert.True(File.Exists(Path.Combine(backups, "not-a-snapshot.json")));
        Assert.True(File.Exists(Path.Combine(backups, "badges-2026-08-02.json")));
    }

    [Fact]
    public void DailySnapshot_RetentionZero_Disables()
    {
        var dataFile = Path.Combine(_dataDir, "disabled-test", "badges.json");
        Directory.CreateDirectory(Path.GetDirectoryName(dataFile)!);
        File.WriteAllText(dataFile, "{}");

        AchievementBadgeService.WriteDailySnapshotCore(dataFile, new DateOnly(2026, 8, 1), 0);

        Assert.False(Directory.Exists(Path.Combine(Path.GetDirectoryName(dataFile)!, "backups")));
    }

    [Fact]
    public void SnapshotRetention_DefaultsToFourteenDays()
    {
        Assert.Equal(14, new PluginConfiguration().SnapshotRetentionDays);
    }

    private const string BankUserId = "44444444-4444-4444-4444-444444444444";
    private const string UnknownUserId = "55555555-5555-5555-5555-555555555555";

    [Fact]
    public void ScoreBankFloor_EmptyReplay_KeepsTheBalance()
    {
        // The reported case. Every item this user watched has since been
        // deleted, so the replay observes nothing at all and the rebuilt bank
        // is zero, even though the reset carried all their badges over.
        var profile = _badges.GetOrCreateProfileDirect(BankUserId);
        profile.ScoreBank = 15;
        _badges.SaveProfileDirect(profile);

        var preScan = _badges.SnapshotScoreBankForUser(BankUserId);
        _badges.ResetBadgesForUser(BankUserId);
        Assert.Equal(0, _badges.PeekProfile(BankUserId)!.ScoreBank);

        _badges.ApplyScoreBankFloor(BankUserId, preScan);

        Assert.Equal(15, _badges.PeekProfile(BankUserId)!.ScoreBank);
    }

    [Fact]
    public void ScoreBankFloor_RicherRebuild_KeepsTheLargerValue()
    {
        // The floor must not cap growth: a replay that legitimately earns more
        // than the user had banked keeps its own result.
        var profile = _badges.GetOrCreateProfileDirect(BankUserId);
        profile.ScoreBank = 120;
        _badges.SaveProfileDirect(profile);

        var preScan = _badges.SnapshotScoreBankForUser(BankUserId);

        var rebuilt = _badges.GetOrCreateProfileDirect(BankUserId);
        rebuilt.ScoreBank = 5707;
        _badges.SaveProfileDirect(rebuilt);

        _badges.ApplyScoreBankFloor(BankUserId, preScan);

        Assert.Equal(5707, _badges.PeekProfile(BankUserId)!.ScoreBank);
    }

    [Fact]
    public void ScoreBankFloor_UnknownUserOrEmptyBank_IsANoOp()
    {
        // A first-ever scan has nothing to floor against, and asking must not
        // materialise a profile as a side effect.
        Assert.Equal(0, _badges.SnapshotScoreBankForUser(UnknownUserId));

        _badges.ApplyScoreBankFloor(UnknownUserId, 0);

        Assert.Null(_badges.PeekProfile(UnknownUserId));
    }
}
