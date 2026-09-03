using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #115. The completion service credits movies through a gate (80%
/// watched) and a dedupe (same item within six hours). Neither fits a game
/// session: there is no 80% of a game, and the same game twice in an evening
/// is two sessions. These pin the game path that skips both while keeping
/// the rate guards, and pin that the movie path still dedupes after the
/// guards were extracted.
/// </summary>
public class GameSessionPipelineTests : IDisposable
{
    private readonly string _dataDir;
    private readonly AchievementBadgeService _badges;
    private readonly PlaybackCompletionService _completion;

    private static readonly Guid Player = Guid.Parse("99999999-5555-6666-7777-888888888888");
    private static readonly Guid Mario = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000001");
    private string PlayerId => Player.ToString("D");

    public GameSessionPipelineTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "abpipe_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dataDir);

        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(_dataDir);

        _badges = new AchievementBadgeService(
            paths.Object,
            new Mock<IUserManager>().Object,
            new WebhookNotifier(NullLogger<WebhookNotifier>.Instance),
            new AuditLogService(paths.Object, NullLogger<AuditLogService>.Instance),
            NullLogger<AchievementBadgeService>.Instance);
        _completion = new PlaybackCompletionService(_badges, paths.Object);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dataDir, recursive: true); } catch { /* best effort */ }
        GC.SuppressFinalize(this);
    }

    private static PlaybackContext Session(long seconds) => new()
    {
        UserId = Player.ToString("D"),
        ItemId = Mario.ToString("D"),
        IsGame = true,
        GamePlatform = "SNES",
        GamePlaySeconds = seconds,
        Studios = new[] { "Nintendo" },
        Silent = true
    };

    [Fact]
    public void TheSameGameTwiceInAnEveningIsTwoSessions()
    {
        // The exact thing the movie path would refuse: the second play of
        // the same item within six hours.
        Assert.True(_completion.RecordGameSession(Session(1800), out _));
        Assert.True(_completion.RecordGameSession(Session(2400), out var message), message);

        var c = _badges.PeekProfile(PlayerId)!.Counters;
        Assert.Equal(2, c.GamePlays);
        Assert.Equal(4200, c.GamePlaySeconds);
        Assert.Equal(1, c.UniqueGamesPlayed);
    }

    [Fact]
    public void ASessionWithNoSecondsIsRefused()
    {
        // Zero is what the tracker hands over when the clamp floor was not
        // met. It must not become a play with no time.
        Assert.False(_completion.RecordGameSession(Session(0), out var message));
        Assert.Contains("short", message, StringComparison.OrdinalIgnoreCase);
        Assert.Null(_badges.PeekProfile(PlayerId));
    }

    [Fact]
    public void ANonGameContextIsRefusedByTheGamePath()
    {
        var movie = Session(1800);
        movie.IsGame = false;
        movie.IsMovie = true;

        Assert.False(_completion.RecordGameSession(movie, out var message));
        Assert.Contains("Not a game", message, StringComparison.Ordinal);
    }

    [Fact]
    public void TheMoviePathStillDedupesAfterTheGuardsMoved()
    {
        // Regression guard for the extraction: the six-hour per-item dedupe
        // and the completion gate stayed on the movie path.
        var movie = new PlaybackContext { UserId = PlayerId, ItemId = Mario.ToString("D"), IsMovie = true, Silent = true };

        Assert.True(_completion.RecordCompletion(movie, 95, out _));
        Assert.False(_completion.RecordCompletion(movie, 95, out var again));
        Assert.Contains("already counted", again, StringComparison.OrdinalIgnoreCase);
        Assert.False(_completion.RecordCompletion(new PlaybackContext { UserId = PlayerId, ItemId = Guid.NewGuid().ToString("D"), IsMovie = true }, 40, out var low));
        Assert.Contains("80%", low, StringComparison.Ordinal);
    }

    [Fact]
    public void TheTrackerHasAGameSessionPath()
    {
        // The two video checks that dropped game sessions live in the
        // tracker's stop handler. A dedicated path is the fix; losing it
        // brings the silent drop back with no test failing anywhere else.
        var method = typeof(PlaybackCompletionTracker)
            .GetMethod("RecordGameSession", BindingFlags.Instance | BindingFlags.NonPublic);

        Assert.NotNull(method);
        Assert.Contains(method!.GetParameters(), p => p.ParameterType == typeof(MediaBrowser.Controller.Entities.BaseItem));
    }
}
