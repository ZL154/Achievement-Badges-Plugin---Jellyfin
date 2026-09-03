using System;
using System.Collections.Generic;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #115. Jellyfin has no game type: JellyEmu stores games as Book
/// items. These pin the three decisions that keep a game from being an
/// ebook and an ebook from being a game, the platform reading, and the
/// session clamp that stands in for the video accumulator, which cannot
/// measure a game (it would read every 30-second progress ping as a seek).
/// </summary>
public class GameSessionTests
{
    private static IReadOnlyList<string> Tags(params string[] tags) => tags;

    private static IReadOnlyDictionary<string, string> Providers(params string[] keys)
    {
        var d = new Dictionary<string, string>();
        foreach (var k in keys) d[k] = "1";
        return d;
    }

    [Fact]
    public void AJellyEmuTaggedBookIsAGame()
    {
        // LocalRomProvider writes "JellyEmu", "Game" and the platform on
        // every ROM. Either of the first two is enough.
        Assert.True(GameSession.IsGame(Tags("JellyEmu", "Game", "SNES", "USA"), null));
        Assert.True(GameSession.IsGame(Tags("Game"), null));
        Assert.True(GameSession.IsGame(Tags("jellyemu"), null));
    }

    [Fact]
    public void AGameProviderIdIsEnoughWithoutTags()
    {
        // The metadata providers write these; a hand-edited item that lost
        // its tags still reads as a game.
        Assert.True(GameSession.IsGame(null, Providers("IGDB")));
        Assert.True(GameSession.IsGame(null, Providers("RAWG")));
        Assert.True(GameSession.IsGame(null, Providers("MD5", "RetroAchievements")));
    }

    [Fact]
    public void AnEbookStaysAnEbook()
    {
        // The case that matters most: an ordinary Books library must not
        // start producing game badges.
        Assert.False(GameSession.IsGame(null, null));
        Assert.False(GameSession.IsGame(Tags("Fiction", "Audiobook"), Providers("ISBN", "GoogleBooks")));
    }

    [Fact]
    public void ThePlatformIsTheTagThatNamesOne()
    {
        // Regions and disc markers sit next to the platform tag and must not
        // be mistaken for it. The canonical spelling is JellyEmu's.
        Assert.Equal("SNES", GameSession.Platform(Tags("JellyEmu", "Game", "USA", "SNES", "Disc 1")));
        Assert.Equal("GameBoyAdvance", GameSession.Platform(Tags("gameboyadvance")));
        Assert.Equal(GameSession.UnknownPlatform, GameSession.Platform(Tags("JellyEmu", "Game", "Europe")));
        Assert.Equal(GameSession.UnknownPlatform, GameSession.Platform(null));
    }

    [Fact]
    public void SessionLengthIsTheSmallerOfClientAndOwnClock()
    {
        // The client's elapsed time is trusted only as far as this plugin's
        // own clock agrees: a client claiming 3 hours after 40 minutes of
        // wall time gets 40 minutes.
        Assert.Equal(2400, GameSession.ClampSeconds(reportedSeconds: 10800, wallClockSeconds: 2400, minSeconds: 60, maxSeconds: 21600));
        Assert.Equal(1800, GameSession.ClampSeconds(1800, 2400, 60, 21600));
    }

    [Fact]
    public void TooShortIsNothingAndTooLongIsTheCap()
    {
        // A launch closed at once is not a play; a tab left open overnight
        // counts as the cap, not the night.
        Assert.Equal(0, GameSession.ClampSeconds(45, 45, 60, 21600));
        Assert.Equal(21600, GameSession.ClampSeconds(40000, 40000, 60, 21600));
        Assert.Equal(0, GameSession.ClampSeconds(-5, 300, 60, 21600));
    }

    [Fact]
    public void GameIsAppendedToMediaTypeAndTheCountersRoundTrip()
    {
        // MediaType is stored by ordinal on every badge definition.
        Assert.Equal(6, (int)MediaType.Game);

        var counters = new UserAchievementCounters();
        Assert.Equal(0, counters.UniqueGamesPlayed);
        Assert.Equal(0, counters.GamePlayHours);

        counters.GamePlays = 3;
        counters.GamePlaySeconds = 7200;
        counters.GamesPlayed.Add("a");
        counters.GamesPlayed.Add("b");
        counters.GamesByPlatform["SNES"] = new HashSet<string> { "a", "b" };
        counters.GameSecondsByItem["a"] = 5400;
        counters.GamesByStudio["Capcom"] = new HashSet<string> { "a", "b" };

        Assert.Equal(2, counters.UniqueGamesPlayed);
        Assert.Equal(1, counters.UniqueGamePlatforms);
        Assert.Equal(2, counters.GamesByPlatform["SNES"].Count);
        Assert.Equal(2, counters.GamePlayHours);
        Assert.Equal(2, counters.GamesByStudio["Capcom"].Count);
    }
}
