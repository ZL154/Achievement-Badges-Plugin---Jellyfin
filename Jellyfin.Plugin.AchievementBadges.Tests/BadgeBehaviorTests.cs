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
/// v2.1.2 regression tests for issues #27 and #24. These exercise the real
/// AchievementBadgeService / PlaybackCompletionService against a temp data
/// directory (no Jellyfin host, no fake auth — Plugin.Instance is null so the
/// config-default code paths run, which is exactly what production uses when a
/// user hasn't overridden the defaults).
///
/// Why these matter: the underlying features (daily-badge backfill, ebook
/// tracking) can't be verified by the maintainer locally — there's no books
/// library and the daily-cluster bug only reproduces on servers with missing
/// LastPlayedDate. These tests lock the behaviour in so a future refactor
/// can't silently regress it.
/// </summary>
public class BadgeBehaviorTests : IDisposable
{
    private readonly string _dataDir;
    private readonly AchievementBadgeService _badges;
    private readonly PlaybackCompletionService _playback;

    public BadgeBehaviorTests()
    {
        _dataDir = Path.Combine(Path.GetTempPath(), "abtest_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dataDir);

        var paths = new Mock<IApplicationPaths>();
        paths.SetupGet(p => p.PluginConfigurationsPath).Returns(_dataDir);

        // _userManager is only touched by GetUserById (line ~2297), which none
        // of the RecordPlayback / RecordBookCompletion paths under test reach.
        var userManager = new Mock<IUserManager>().Object;
        var webhook = new WebhookNotifier(NullLogger<WebhookNotifier>.Instance);
        var audit = new AuditLogService(paths.Object, NullLogger<AuditLogService>.Instance);

        _badges = new AchievementBadgeService(
            paths.Object, userManager, webhook, audit,
            NullLogger<AchievementBadgeService>.Instance);
        _playback = new PlaybackCompletionService(_badges, paths.Object, audit);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dataDir, recursive: true); } catch { /* best effort */ }
        GC.SuppressFinalize(this);
    }

    private const string UserId = "11111111-1111-1111-1111-111111111111";

    private UserAchievementCounters Counters(string userId = UserId)
        => _badges.PeekProfile(userId)!.Counters;

    // ============================================================
    // Issue #27 — backfill must not poison the per-day buckets that
    // back the MaxXInSingleDay daily badges.
    // ============================================================

    [Fact]
    public void Backfill_SilentMovies_DoNotFillDailyBuckets()
    {
        // Simulate the backfill failure mode: every item clusters onto the
        // SAME day (LastPlayedDate missing → falls back to "now").
        var day = new DateTimeOffset(2026, 6, 14, 12, 0, 0, TimeSpan.Zero);
        for (var i = 0; i < 7; i++)
        {
            _badges.RecordPlayback(new PlaybackContext
            {
                UserId = UserId,
                ItemId = $"movie-{i}",
                IsMovie = true,
                PlayedAt = day,
                Silent = true, // backfill always sets Silent
            });
        }

        var c = Counters();
        // Lifetime total is still credited...
        Assert.Equal(7, c.MoviesWatched);
        // ...but the daily bucket stays empty, so the daily badge can't fire.
        Assert.Equal(0, c.MaxMoviesInSingleDay);
    }

    [Fact]
    public void RealTimeMovies_DoFillDailyBuckets()
    {
        // Real (non-silent) plays on one real day MUST drive the daily badge.
        var day = new DateTimeOffset(2026, 6, 14, 20, 0, 0, TimeSpan.Zero);
        for (var i = 0; i < 3; i++)
        {
            _badges.RecordPlayback(new PlaybackContext
            {
                UserId = UserId,
                ItemId = $"rt-movie-{i}",
                IsMovie = true,
                PlayedAt = day,
                Silent = false,
            });
        }

        var c = Counters();
        Assert.Equal(3, c.MoviesWatched);
        Assert.Equal(3, c.MaxMoviesInSingleDay);
    }

    [Fact]
    public void Backfill_ThenRealTime_DailyMaxReflectsOnlyRealPlays()
    {
        // The exact regression from the issue comments: scan first (clustered,
        // silent), THEN a real play. The daily max must reflect only the real
        // play — not the inflated backfill cluster.
        var scanDay = new DateTimeOffset(2026, 6, 1, 9, 0, 0, TimeSpan.Zero);
        for (var i = 0; i < 10; i++)
        {
            _badges.RecordPlayback(new PlaybackContext
            {
                UserId = UserId,
                ItemId = $"scan-{i}",
                IsMovie = true,
                PlayedAt = scanDay,
                Silent = true,
            });
        }

        _badges.RecordPlayback(new PlaybackContext
        {
            UserId = UserId,
            ItemId = "live-1",
            IsMovie = true,
            PlayedAt = new DateTimeOffset(2026, 6, 14, 21, 0, 0, TimeSpan.Zero),
            Silent = false,
        });

        var c = Counters();
        Assert.Equal(11, c.MoviesWatched);       // all credited lifetime
        Assert.Equal(1, c.MaxMoviesInSingleDay);  // but daily max is just the 1 real play
    }

    // ============================================================
    // Issue #24 — ebook completions credit Book badges, and the
    // real-time path dedups re-toggles (v2.1.2 hardening).
    // ============================================================

    [Fact]
    public void RecordBookCompletion_CreditsBook()
    {
        _playback.RecordBookCompletion(new PlaybackContext
        {
            UserId = UserId,
            ItemId = "book-1",
            IsBook = true,
            PlayedAt = new DateTimeOffset(2026, 6, 14, 10, 0, 0, TimeSpan.Zero),
        });

        Assert.Equal(1, Counters().BooksCompleted);
    }

    [Fact]
    public void RecordBookCompletion_ReToggleWithinWindow_DoesNotDoubleCount()
    {
        var t = new DateTimeOffset(2026, 6, 14, 10, 0, 0, TimeSpan.Zero);

        // Mark read, then toggle unread→read again 1 minute later (same item).
        _playback.RecordBookCompletion(new PlaybackContext
        { UserId = UserId, ItemId = "book-1", IsBook = true, PlayedAt = t });
        _playback.RecordBookCompletion(new PlaybackContext
        { UserId = UserId, ItemId = "book-1", IsBook = true, PlayedAt = t.AddMinutes(1) });

        // Counted once, not twice.
        Assert.Equal(1, Counters().BooksCompleted);
    }

    [Fact]
    public void RecordBookCompletion_DistinctBooks_EachCount()
    {
        var t = new DateTimeOffset(2026, 6, 14, 10, 0, 0, TimeSpan.Zero);
        _playback.RecordBookCompletion(new PlaybackContext
        { UserId = UserId, ItemId = "book-1", IsBook = true, PlayedAt = t });
        _playback.RecordBookCompletion(new PlaybackContext
        { UserId = UserId, ItemId = "book-2", IsBook = true, PlayedAt = t.AddMinutes(1) });

        Assert.Equal(2, Counters().BooksCompleted);
    }

    [Fact]
    public void RecordBookCompletion_GenuineReReadAfterWindow_CountsAgain()
    {
        // A real re-read 7h later (past the 6h dedup window) credits again —
        // matches the movie/episode rewatch convention.
        var t = new DateTimeOffset(2026, 6, 14, 10, 0, 0, TimeSpan.Zero);
        _playback.RecordBookCompletion(new PlaybackContext
        { UserId = UserId, ItemId = "book-1", IsBook = true, PlayedAt = t });
        _playback.RecordBookCompletion(new PlaybackContext
        { UserId = UserId, ItemId = "book-1", IsBook = true, PlayedAt = t.AddHours(7) });

        Assert.Equal(2, Counters().BooksCompleted);
    }
}
