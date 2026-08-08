using System;
using System.IO;
using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Configuration;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #43: the admin picks the achievements UI style users start on, and
/// can optionally make it the only one available so the page matches the
/// server's Jellyfin theme.
/// </summary>
public class UiStyleDefaultTests
{
    private static string ReadEmbedded(string suffix)
    {
        var assembly = typeof(Plugin).Assembly;
        var name = assembly.GetManifestResourceNames().Single(n => n.EndsWith(suffix, StringComparison.Ordinal));
        using var stream = assembly.GetManifestResourceStream(name)!;
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    [Fact]
    public void Defaults_ChangeNothingForExistingServers()
    {
        var config = new PluginConfiguration();

        Assert.Equal("classic", config.DefaultUiStyle);
        Assert.False(config.ForceDefaultUiStyle);
    }

    [Theory]
    [InlineData("revamp", "revamp")]
    [InlineData("Revamp", "revamp")]
    [InlineData("REVAMP", "revamp")]
    [InlineData("classic", "classic")]
    [InlineData("", "classic")]
    [InlineData("  ", "classic")]
    [InlineData("nonsense", "classic")]
    [InlineData(null, "classic")]
    public void UiStyle_IsNormalisedBeforeItReachesTheClient(string? stored, string expected)
    {
        // The setting is a free string in the config file. A hand edited or
        // misspelt value must not leave the client with a style it cannot
        // resolve, least of all while the toggle is hidden by the lock.
        Assert.Equal(expected, UiStyle.Normalize(stored));
    }

    [Fact]
    public void Client_ResolvesForcedOverUserChoiceOverAdminDefault()
    {
        // Both scripts must agree, since the sidebar decides the style on every
        // page load while the standalone page owns the toggle.
        foreach (var script in new[] { "standalone.js", "sidebar.js" })
        {
            var js = ReadEmbedded(script);
            Assert.Contains("ab-style-admin-forced", js);
            Assert.Contains("ab-style-admin-default", js);
            Assert.Contains("ab-style-pref", js);
        }
    }

    [Fact]
    public void Client_MirrorsTheAdminSettingsFromPublicConfig()
    {
        // sidebar.js reads the mirror synchronously to avoid painting one style
        // and swapping it, so something has to keep the mirror fresh.
        var js = ReadEmbedded("standalone.js");

        Assert.Contains("DefaultUiStyle", js);
        Assert.Contains("ForceDefaultUiStyle", js);
        Assert.Contains("cacheAdminStyle", js);
    }

    [Fact]
    public void Client_GuardsTheToggleItself_NotJustItsVisibility()
    {
        // The click handler is wired before public-config has necessarily
        // landed, and a hidden element is still reachable.
        var js = ReadEmbedded("standalone.js");

        Assert.Contains("btn.hidden = isStyleForced()", js);
        Assert.Contains("if (isStyleForced()) { applyStylePref(getStylePref()); return; }", js);
    }

    [Fact]
    public void AdminPage_ExposesBothControls()
    {
        var html = ReadEmbedded("index.html");

        Assert.Contains("abFcDefaultUiStyle", html);
        Assert.Contains("abFcForceDefaultUiStyle", html);
        // Saved as well as loaded: an unwired control silently discards the
        // admin's choice on every save.
        Assert.Contains("DefaultUiStyle:", html);
        Assert.Contains("ForceDefaultUiStyle:", html);
    }
}
