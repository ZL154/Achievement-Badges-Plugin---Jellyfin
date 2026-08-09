using System;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// The achievements page ships two looks, Classic and Revamp, and the client
/// only knows those two strings.
/// <para>
/// The admin's choice is stored as a free string in the plugin configuration,
/// so it can arrive empty, misspelt or hand edited. Normalising it in one
/// place keeps a bad value from reaching the client, which matters most while
/// <c>ForceDefaultUiStyle</c> is on: the user has no toggle to escape with.
/// </para>
/// </summary>
public static class UiStyle
{
    /// <summary>The style used when nothing valid has been configured.</summary>
    public const string Classic = "classic";

    /// <summary>The alternative look.</summary>
    public const string Revamp = "revamp";

    /// <summary>
    /// Collapses any stored value to <see cref="Classic"/> or
    /// <see cref="Revamp"/>. Comparison is case insensitive and surrounding
    /// whitespace is ignored; anything unrecognised falls back to Classic,
    /// which is what the plugin has always defaulted to.
    /// </summary>
    public static string Normalize(string? value)
    {
        return string.Equals(value?.Trim(), Revamp, StringComparison.OrdinalIgnoreCase)
            ? Revamp
            : Classic;
    }
}
