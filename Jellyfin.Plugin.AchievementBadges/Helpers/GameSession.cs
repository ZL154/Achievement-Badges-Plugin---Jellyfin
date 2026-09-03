using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// [issue #115] What makes a Jellyfin item a game, which platform it is on,
/// and how long a game session counts for. Pure, so it can be tested without
/// a library.
/// <para>
/// Jellyfin has no game item type. JellyEmu stores every ROM as a
/// <c>Book</c> in a Books library and tags it with <c>JellyEmu</c>,
/// <c>Game</c> and the platform (LocalRomProvider), and its metadata
/// providers write IGDB / RAWG / RetroAchievements provider ids. An ebook has
/// none of that, so those markers are what tells the two apart.
/// </para>
/// <para>
/// Play time is not the video accumulator's job. JellyEmu reports a session's
/// elapsed wall-clock time as the playback position, which the video path
/// would read as one 30-second seek after another and discard. A game session
/// is measured as the smaller of what the client reported and what this
/// plugin saw on its own clock, bounded on both ends: below the floor it is a
/// misclick, above the cap it is a tab left open.
/// </para>
/// </summary>
public static class GameSession
{
    public const string JellyEmuTag = "JellyEmu";
    public const string GameTag = "Game";
    public const string UnknownPlatform = "Unknown";

    private static readonly string[] GameProviderKeys = { "IGDB", "RAWG", "RetroAchievements" };

    /// <summary>
    /// The platform tags JellyEmu's PlatformResolver can write, both the ones
    /// its web emulator runs and the library-only ones. Anything else on an
    /// item is a region, a disc marker or a user tag, not a platform.
    /// </summary>
    public static IReadOnlySet<string> Platforms => PlatformSet;

    // HashSet rather than the read-only interface because TryGetValue, which
    // hands back the canonical spelling for a case-insensitive hit, lives on
    // the concrete type only.
    private static readonly HashSet<string> PlatformSet = new(StringComparer.OrdinalIgnoreCase)
    {
        "3DO", "Arcade", "Atari2600", "Atari5200", "Atari7800", "AtariJaguar", "AtariLynx",
        "ColecoVision", "Commodore64", "CommodoreAmiga", "DOS", "GameBoy", "GameBoyAdvance",
        "GameBoyColor", "GameGear", "MAME2003", "MasterSystem", "N64", "NeoGeoPocket", "NES",
        "Nintendo3DS", "NintendoDS", "PC-FX", "PICO-8", "PlayStation", "PSP", "Sega32X", "SegaCD",
        "SegaGenesis", "SegaSaturn", "SNES", "TurboGrafx-16", "VirtualBoy", "WonderSwan",
        "Dreamcast", "GameCube", "NintendoSwitch", "PlayStation2", "PlayStation3", "PlayStationVita",
        "Wii", "WiiU", "Windows", "Xbox", "Xbox360",
    };

    public static bool IsGame(IReadOnlyList<string>? tags, IReadOnlyDictionary<string, string>? providerIds)
    {
        if (tags is not null)
        {
            foreach (var tag in tags)
            {
                if (string.Equals(tag, JellyEmuTag, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(tag, GameTag, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
        }

        if (providerIds is not null)
        {
            foreach (var key in providerIds.Keys)
            {
                foreach (var gameKey in GameProviderKeys)
                {
                    if (string.Equals(key, gameKey, StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /// <summary>
    /// The first tag that names a known platform, in JellyEmu's canonical
    /// spelling, or <see cref="UnknownPlatform"/>. Unknown never counts as a
    /// distinct platform.
    /// </summary>
    public static string Platform(IReadOnlyList<string>? tags)
    {
        if (tags is null)
        {
            return UnknownPlatform;
        }

        foreach (var tag in tags)
        {
            if (PlatformSet.TryGetValue(tag, out var canonical))
            {
                return canonical;
            }
        }

        return UnknownPlatform;
    }

    /// <summary>
    /// Seconds a session counts for. Zero when the session is shorter than
    /// <paramref name="minSeconds"/> (a launch that was closed at once), and
    /// never more than <paramref name="maxSeconds"/> (a tab left open). The
    /// client's number is trusted only as far as this plugin's own clock
    /// agrees with it.
    /// </summary>
    public static long ClampSeconds(long reportedSeconds, long wallClockSeconds, long minSeconds, long maxSeconds)
    {
        var seconds = Math.Min(Math.Max(reportedSeconds, 0), Math.Max(wallClockSeconds, 0));
        if (seconds < Math.Max(minSeconds, 0))
        {
            return 0;
        }

        return maxSeconds > 0 ? Math.Min(seconds, maxSeconds) : seconds;
    }
}
