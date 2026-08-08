using System;
using System.IO;
using System.Linq;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Pins the rules that keep the plugin's floating UI off the video player.
/// The header badge row has been hidden during playback for a long time; the
/// friends button is position:fixed at the same kind of z-index and needs the
/// same treatment, or it covers the OSD controls.
/// </summary>
public class PlayerOverlayTests
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
    public void FriendsButton_IsHiddenDuringPlayback_FromTheGloballyInjectedBlock()
    {
        // The load bearing copy must be in enhance.js: styles-revamp.css only
        // loads with the revamp theme on the plugin's own pages, while the
        // button floats on every page, including over the player.
        var js = ReadEmbedded("enhance.js");

        Assert.Contains("body:has(.videoPlayerContainer) #abFriendsBtn", js);
        Assert.Contains("body.videoOsdOpen #abFriendsBtn", js);
        Assert.Contains(".videoPlayer #abFriendsBtn", js);
        Assert.Contains("body:has(.mainAnimatedPage.videoOsdPage) #abFriendsBtn { display: none !important; }", js);
    }

    [Fact]
    public void FriendsButton_RuleIsUnscoped_SoEveryThemeGetsIt()
    {
        var css = ReadEmbedded("styles-revamp.css");

        var start = css.IndexOf("body:has(.videoPlayerContainer) #abFriendsBtn", StringComparison.Ordinal);
        Assert.True(start >= 0, "the redundant revamp copy of the rule is missing");

        var rule = css.Substring(start);
        rule = rule.Substring(0, rule.IndexOf('}'));
        Assert.Contains("display: none !important", rule);
    }

    [Fact]
    public void ToastContainer_Stylesheet_AnchorsTopRight()
    {
        // Toasts stay up during playback on purpose, so where they sit matters:
        // bottom centre is the subtitle line.
        var css = ReadEmbedded("styles-revamp.css");
        var block = css.Substring(css.IndexOf("#ab-toast-container {", StringComparison.Ordinal));
        block = block.Substring(0, block.IndexOf('}'));

        Assert.Contains("top: 4.5em !important", block);
        Assert.Contains("right: 1.2em !important", block);
        Assert.Contains("bottom: auto !important", block);
        Assert.Contains("left: auto !important", block);
        Assert.Contains("align-items: flex-end !important", block);
    }

    [Fact]
    public void ToastContainer_InlineFallback_MatchesTheStylesheet()
    {
        // enhance.js builds the container before any sheet is guaranteed to be
        // loaded, so the inline style has to agree or the first toast of a
        // session lands on the subtitles anyway.
        var js = ReadEmbedded("enhance.js");

        Assert.Contains("top:4.5em;right:1.2em", js);
        Assert.Contains("align-items:flex-end", js);
        Assert.DoesNotContain("bottom:24px;left:0;right:0", js);
    }

    [Fact]
    public void HeaderBadges_KeepTheirExistingPlaybackRules()
    {
        // Guards the selector battery the friends button rule was modelled on,
        // so a future edit cannot quietly drop half of it.
        var js = ReadEmbedded("enhance.js");

        Assert.Contains("body:has(.videoPlayerContainer) #ab-header-badges", js);
        Assert.Contains("body.videoOsdOpen #ab-header-badges", js);
    }
}
