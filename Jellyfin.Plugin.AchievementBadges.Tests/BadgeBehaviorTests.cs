using System;
using System.IO;
using System.Text.Json;
using Jellyfin.Plugin.AchievementBadges.Configuration;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using Jellyfin.Plugin.AchievementBadges.Helpers;
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

    [Fact]
    public void PageIntegrations_AreOptInByDefault()
    {
        var config = new PluginConfiguration();

        Assert.False(config.EnableCustomTabsIntegration);
        Assert.False(config.EnablePluginPagesIntegration);
        Assert.False(config.EnableUserMenuShortcut);
    }

    [Fact]
    public void PageIntegrationAssets_ArePackagedWithSharedHostContract()
    {
        var assembly = typeof(Plugin).Assembly;
        using var scriptStream = assembly.GetManifestResourceStream(
            "Jellyfin.Plugin.AchievementBadges.Pages.standalone.js");
        using var configStream = assembly.GetManifestResourceStream(
            "Jellyfin.Plugin.AchievementBadges.Configuration.configPage.html");
        using var adminStream = assembly.GetManifestResourceStream(
            "Jellyfin.Plugin.AchievementBadges.Pages.index.html");
        using var enhanceStream = assembly.GetManifestResourceStream(
            "Jellyfin.Plugin.AchievementBadges.Pages.enhance.js");

        Assert.NotNull(scriptStream);
        Assert.NotNull(configStream);
        Assert.NotNull(adminStream);
        Assert.NotNull(enhanceStream);
        using var scriptReader = new StreamReader(scriptStream!);
        using var configReader = new StreamReader(configStream!);
        using var adminReader = new StreamReader(adminStream!);
        using var enhanceReader = new StreamReader(enhanceStream!);
        var script = scriptReader.ReadToEnd();
        var configPage = configReader.ReadToEnd();
        var adminPage = adminReader.ReadToEnd();
        var enhanceScript = enhanceReader.ReadToEnd();

        Assert.Contains("data-achievement-badges-host", script, StringComparison.Ordinal);
        Assert.Contains("data-ab-embedded", script, StringComparison.Ordinal);
        Assert.Contains("data-achievement-badges-host=\"custom-tabs\"", configPage, StringComparison.Ordinal);
        Assert.Contains("data-achievement-badges-host=\"custom-tabs\"", adminPage, StringComparison.Ordinal);
        Assert.Contains("fbacd0b6-fd46-4a05-b0a4-2045d6a135b0", configPage, StringComparison.Ordinal);
        Assert.Contains("fbacd0b6-fd46-4a05-b0a4-2045d6a135b0", adminPage, StringComparison.Ordinal);
        Assert.Contains("ShowCustomTabsEntry", script, StringComparison.Ordinal);
        Assert.Contains("ShowPluginPagesEntry", script, StringComparison.Ordinal);
        Assert.Contains("ShowUserMenuShortcut", script, StringComparison.Ordinal);
        Assert.Contains("Test 10 unlocks", configPage, StringComparison.Ordinal);
        Assert.Contains("testUnlockBatch()", configPage, StringComparison.Ordinal);
        Assert.Contains("id=\"abTestToastBatchBtn\"", adminPage, StringComparison.Ordinal);
        Assert.Contains("window.abAchievementTestBatch", enhanceScript, StringComparison.Ordinal);
        Assert.Contains("showUnlockBatch(testBadges, prefs)", enhanceScript, StringComparison.Ordinal);
        Assert.Contains("ToastNavigation", enhanceScript, StringComparison.Ordinal);
        Assert.Contains("IsSyntheticTest", enhanceScript, StringComparison.Ordinal);
        Assert.Contains("applyAchievementRouteTarget", script, StringComparison.Ordinal);
        Assert.Contains("data-badge-id", script, StringComparison.Ordinal);
        Assert.Contains("ab-toast-focus", script, StringComparison.Ordinal);
    }

    [Fact]
    public void NavigationIntegrationPreferences_AreIndependentAndDefaultOn()
    {
        var defaults = new UserNotificationPreferences();
        Assert.True(defaults.ShowCustomTabsEntry);
        Assert.True(defaults.ShowPluginPagesEntry);
        Assert.True(defaults.ShowUserMenuShortcut);

        _badges.SaveUserPreferences(UserId, new UserNotificationPreferences
        {
            ShowCustomTabsEntry = false,
            ShowPluginPagesEntry = true,
            ShowUserMenuShortcut = false
        });

        var stored = _badges.GetUserPreferences(UserId);
        Assert.False(stored.ShowCustomTabsEntry);
        Assert.True(stored.ShowPluginPagesEntry);
        Assert.False(stored.ShowUserMenuShortcut);
    }

    [Fact]
    public void NavigationIntegrationTranslations_ArePresentInEveryUiLocale()
    {
        var assembly = typeof(Plugin).Assembly;
        var locales = new[] { "en", "de", "fr", "es", "it", "pt", "zh", "ja" };
        var keys = new[]
        {
            "settings.navigation_integrations",
            "settings.show_custom_tabs_entry",
            "settings.show_plugin_pages_entry",
            "settings.show_user_menu_shortcut",
            "admin.page_integrations.saved_custom_tabs_unavailable",
            "admin.test_toast.batch_button",
            "admin.test_toast.batch_help",
            "admin.msg.firing_batch",
            "toast.view_achievement",
            "toast.view_recent_unlocks"
        };

        foreach (var locale in locales)
        {
            using var stream = assembly.GetManifestResourceStream(
                $"Jellyfin.Plugin.AchievementBadges.Pages.translations.{locale}.json");
            Assert.NotNull(stream);
            using var document = JsonDocument.Parse(stream!);
            foreach (var key in keys)
            {
                Assert.True(document.RootElement.TryGetProperty(key, out _), $"Missing {key} in {locale}.json");
            }
        }
    }

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

    // ============================================================
    // Issue #24 — per-genre MUSIC play counts (so genre-filtered
    // custom badges like "play 50 disco tracks" actually filter).
    // ============================================================

    [Fact]
    public void MusicPlays_TrackedPerGenre_WithListeningSeconds()
    {
        var t = new DateTimeOffset(2026, 6, 14, 12, 0, 0, TimeSpan.Zero);
        // 3 Disco tracks + 2 Metal tracks, 200s each.
        for (var i = 0; i < 3; i++)
        {
            _badges.RecordPlayback(new PlaybackContext
            {
                UserId = UserId,
                ItemId = $"disco-{i}",
                IsMusic = true,
                Genres = new[] { "Disco" },
                RunTimeTicks = 200L * TimeSpan.TicksPerSecond,
                PlayedAt = t,
            });
        }

        for (var i = 0; i < 2; i++)
        {
            _badges.RecordPlayback(new PlaybackContext
            {
                UserId = UserId,
                ItemId = $"metal-{i}",
                IsMusic = true,
                Genres = new[] { "Metal" },
                RunTimeTicks = 200L * TimeSpan.TicksPerSecond,
                PlayedAt = t,
            });
        }

        var c = Counters();
        Assert.Equal(5, c.MusicPlays);                            // total across genres
        Assert.Equal(3, c.MusicGenrePlayCounts["Disco"]);         // per-genre isolation
        Assert.Equal(2, c.MusicGenrePlayCounts["Metal"]);
        Assert.False(c.MusicGenrePlayCounts.ContainsKey("Jazz")); // untouched genres absent
        Assert.Equal(600, c.MusicGenreListeningSeconds["Disco"]); // 3 * 200s
        Assert.Equal(400, c.MusicGenreListeningSeconds["Metal"]); // 2 * 200s
    }

    // ============================================================
    // Issue #24 — deleting a custom badge must purge its earned +
    // equipped copies from every user profile (not just the sidecar
    // definition), else users keep seeing the deleted badge.
    // ============================================================

    [Fact]
    public void PurgeCustomBadge_RemovesEarnedAndEquipped_KeepsOthers()
    {
        var profile = _badges.GetOrCreateProfileDirect(UserId);
        profile.Badges.Add(new AchievementBadge { Id = "custom-x", Key = "custom-x", Title = "Deleted", Unlocked = true });
        profile.Badges.Add(new AchievementBadge { Id = "keep-me", Key = "keep-me", Title = "Kept", Unlocked = true });
        profile.EquippedBadgeIds.Add("custom-x");
        profile.EquippedBadgeIds.Add("keep-me");
        profile.EquippedTitleBadgeId = "custom-x";
        _badges.SaveProfileDirect(profile);

        var affected = _badges.PurgeCustomBadge("custom-x");

        Assert.Equal(1, affected);
        var p = _badges.PeekProfile(UserId)!;
        Assert.DoesNotContain(p.Badges, b => b.Id == "custom-x");     // earned copy gone
        Assert.Contains(p.Badges, b => b.Id == "keep-me");            // others untouched
        Assert.DoesNotContain("custom-x", p.EquippedBadgeIds);        // un-equipped
        Assert.Contains("keep-me", p.EquippedBadgeIds);
        Assert.Null(p.EquippedTitleBadgeId);                          // title badge cleared
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

    // ============================================================
    // Issues #37/#38 — notification policy and device provenance.
    // ============================================================

    [Theory]
    [InlineData(null, UnlockNotificationPolicy.Grouped)]
    [InlineData("unknown", UnlockNotificationPolicy.Grouped)]
    [InlineData("GROUPED", UnlockNotificationPolicy.Grouped)]
    [InlineData(" individual ", UnlockNotificationPolicy.Individual)]
    public void UnlockGrouping_NormalizesToSupportedValues(string? input, string expected)
    {
        Assert.Equal(expected, UnlockNotificationPolicy.NormalizeGrouping(input));
    }

    [Theory]
    [InlineData(null, UnlockNotificationPolicy.AllDevices)]
    [InlineData("unknown", UnlockNotificationPolicy.AllDevices)]
    [InlineData("ALL-DEVICES", UnlockNotificationPolicy.AllDevices)]
    [InlineData(" originating-device ", UnlockNotificationPolicy.OriginatingDevice)]
    public void UnlockDeviceScope_NormalizesToSupportedValues(string? input, string expected)
    {
        Assert.Equal(expected, UnlockNotificationPolicy.NormalizeDeviceScope(input));
    }

    [Fact]
    public void OriginatingDevicePolicy_RequiresMatchingStampedDevice()
    {
        var badge = new AchievementBadge { UnlockDeviceId = "living-room-tv" };

        Assert.True(UnlockNotificationPolicy.ShouldDeliver(
            badge, UnlockNotificationPolicy.AllDevices, null));
        Assert.True(UnlockNotificationPolicy.ShouldDeliver(
            badge, UnlockNotificationPolicy.OriginatingDevice, "LIVING-ROOM-TV"));
        Assert.False(UnlockNotificationPolicy.ShouldDeliver(
            badge, UnlockNotificationPolicy.OriginatingDevice, "bedroom-tv"));
        Assert.False(UnlockNotificationPolicy.ShouldDeliver(
            new AchievementBadge(), UnlockNotificationPolicy.OriginatingDevice, "living-room-tv"));
    }

    [Fact]
    public void RecordPlayback_StampsOriginDeviceOnNewUnlock()
    {
        _badges.RecordPlayback(new PlaybackContext
        {
            UserId = UserId,
            ItemId = "device-stamp-1",
            OriginDeviceId = "web-client-123",
            IsMovie = true,
            PlayedAt = new DateTimeOffset(2026, 7, 20, 20, 0, 0, TimeSpan.Zero),
        });

        var firstContact = _badges.GetBadgesForUser(UserId)
            .Single(b => b.Id == "first-contact");
        Assert.True(firstContact.Unlocked);
        Assert.Equal("web-client-123", firstContact.UnlockDeviceId);
    }

    [Fact]
    public void SilentBackfill_DoesNotStampOriginDevice()
    {
        _badges.RecordPlayback(new PlaybackContext
        {
            UserId = UserId,
            ItemId = "backfill-device-stamp-1",
            OriginDeviceId = "should-not-persist",
            IsMovie = true,
            Silent = true,
            PlayedAt = new DateTimeOffset(2025, 1, 2, 20, 0, 0, TimeSpan.Zero),
        });

        var firstContact = _badges.GetBadgesForUser(UserId)
            .Single(b => b.Id == "first-contact");
        Assert.True(firstContact.Unlocked);
        Assert.Null(firstContact.UnlockDeviceId);
    }

    /// <summary>
    /// Regression test for the data loss described in issue #48.
    /// <para>
    /// ResetBadgesForUser exists so the watch-history backfill can recompute
    /// counters. Counters are therefore expected to go back to zero. Nothing
    /// else in the profile comes from playback, so nothing else may be lost:
    /// media that has since been deleted can never be counted again, which
    /// means a rebuild would otherwise revoke badges the user really earned
    /// and hand back a showcase they never chose.
    /// </para>
    /// </summary>
    [Fact]
    public void ResetBadgesForUser_KeepsWhatWatchHistoryCannotRebuild()
    {
        _badges.RecordPlayback(UserId, isMovie: true, libraryName: "Movies");

        var before = _badges.PeekProfile(UserId)!;
        var earned = before.Badges.Where(b => b.Unlocked).Select(b => b.Id).ToList();
        Assert.NotEmpty(earned);

        before.EquippedBadgeIds.Clear();
        before.EquippedBadgeIds.Add(earned[0]);
        before.OwnedCosmetics.Add("title-curator");
        before.FriendRequestsSent.Add("22222222-2222-2222-2222-222222222222");
        before.PowerUpInventory["streak-freeze"] = 2;
        before.PrestigeLevel = 3;
        before.LifetimeScoreSpent = 450;
        before.Preferences.Language = "pt-br";

        _badges.ResetBadgesForUser(UserId);

        var after = _badges.PeekProfile(UserId)!;

        // The one thing the backfill does rebuild.
        Assert.Equal(0, after.Counters.TotalItemsWatched);

        // Everything it cannot.
        Assert.Equal(new[] { earned[0] }, after.EquippedBadgeIds);
        Assert.Contains("title-curator", after.OwnedCosmetics);
        Assert.Contains("22222222-2222-2222-2222-222222222222", after.FriendRequestsSent);
        Assert.Equal(2, after.PowerUpInventory["streak-freeze"]);
        Assert.Equal(3, after.PrestigeLevel);
        Assert.Equal(450, after.LifetimeScoreSpent);
        Assert.Equal("pt-br", after.Preferences.Language);

        foreach (var id in earned)
        {
            Assert.True(
                after.Badges.Single(b => b.Id == id).Unlocked,
                $"badge {id} was earned before the reset and must stay earned");
        }
    }
}
