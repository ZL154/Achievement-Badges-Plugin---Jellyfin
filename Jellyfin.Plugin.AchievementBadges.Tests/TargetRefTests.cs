using System;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #107. The target parameter carries both halves of an identity: the
/// GUID, which survives a rename, and the name, which survives a delete and
/// re-add. These pin the parsing, including the case that bites first: a
/// display name that itself contains the separator.
/// </summary>
public class TargetRefTests
{
    private static readonly Guid Target = Guid.Parse("11111111-2222-3333-4444-555555555555");

    [Fact]
    public void FormatAndParseRoundTrip()
    {
        var raw = TargetRef.Format(Target, "One Piece");

        Assert.True(TargetRef.TryParse(raw, out var id, out var name));
        Assert.Equal(Target, id);
        Assert.Equal("One Piece", name);
        Assert.Equal(Target.ToString("N"), TargetRef.KeyOf(raw));
    }

    [Fact]
    public void ANameWrittenByHandParsesWithNoGuid()
    {
        // Admins can POST criteria straight to the API, and the docs show
        // name-shaped parameters for the older metrics. A bare name must not
        // throw; it resolves later, and KeyOf reports "not resolved yet".
        Assert.True(TargetRef.TryParse("One Piece", out var id, out var name));
        Assert.Equal(Guid.Empty, id);
        Assert.Equal("One Piece", name);
        Assert.Null(TargetRef.KeyOf("One Piece"));
    }

    [Fact]
    public void TheSeparatorInsideADisplayNameSurvives()
    {
        // Real library titles contain pipes. Splitting on the last separator,
        // or on all of them, truncates the name and breaks the fallback lookup
        // exactly when it is needed.
        var raw = TargetRef.Format(Target, "Rock | Roll: Live");

        Assert.True(TargetRef.TryParse(raw, out var id, out var name));
        Assert.Equal(Target, id);
        Assert.Equal("Rock | Roll: Live", name);
    }

    [Fact]
    public void EmptyInputIsRejected()
    {
        Assert.False(TargetRef.TryParse(null, out _, out _));
        Assert.False(TargetRef.TryParse("   ", out _, out _));
        Assert.Null(TargetRef.KeyOf(null));
    }

    [Fact]
    public void DashedGuidsAreAcceptedToo()
    {
        // The picker writes "N", but a hand-written parameter may paste the
        // dashed form straight out of the Jellyfin URL bar.
        var raw = Target.ToString("D") + "|One Piece";

        Assert.True(TargetRef.TryParse(raw, out var id, out _));
        Assert.Equal(Target, id);
        Assert.Equal(Target.ToString("N"), TargetRef.KeyOf(raw));
    }
}
