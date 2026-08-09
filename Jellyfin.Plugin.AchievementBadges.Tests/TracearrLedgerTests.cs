using System;
using System.IO;
using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// The standalone Tracearr sync writes onto live counters, with no reset in
/// front of it. Everything that stops it double crediting lives here, so these
/// pin the one failure that cannot be undone: pressing the button twice and
/// counting the same viewings again.
/// </summary>
public class TracearrLedgerTests : IDisposable
{
    private readonly string _dir;

    public TracearrLedgerTests()
    {
        _dir = Path.Combine(Path.GetTempPath(), "abledger_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dir, recursive: true); } catch { /* best effort */ }
        GC.SuppressFinalize(this);
    }

    private string Path_ => Path.Combine(_dir, "tracearr-credited.json");

    private static TracearrPlay Play(string id, string ratingKey, string startedAt)
        => new()
        {
            Id = id,
            RatingKey = ratingKey,
            MediaType = "movie",
            Watched = true,
            StartedAt = DateTimeOffset.Parse(startedAt, System.Globalization.CultureInfo.InvariantCulture)
        };

    [Fact]
    public void PressingTheButtonTwiceCreditsNothingTheSecondTime()
    {
        // The whole reason the ledger exists.
        var ledger = new TracearrCreditLedger(Path_);
        var plays = new[]
        {
            Play("chain-1", "item-a", "2026-01-01T10:00:00Z"),
            Play("chain-2", "item-a", "2026-02-01T10:00:00Z")
        };

        var first = TracearrCreditPlan.Build(plays, new HashSet<string>(), ledger.For("u1"));
        Assert.Equal(2, first.Count);
        ledger.Remember("u1", first.Select(c => c.Play.Id!));

        var second = TracearrCreditPlan.Build(plays, new HashSet<string>(), ledger.For("u1"));
        Assert.Empty(second);
    }

    [Fact]
    public void ANewPlayIsStillCreditedAfterAnEarlierSync()
    {
        var ledger = new TracearrCreditLedger(Path_);
        ledger.Remember("u1", new[] { "chain-1" });

        var plan = TracearrCreditPlan.Build(
            new[] { Play("chain-1", "item-a", "2026-01-01T10:00:00Z"), Play("chain-2", "item-a", "2026-02-01T10:00:00Z") },
            new HashSet<string>(),
            ledger.For("u1"));

        // Only the one it has not seen, and it is still a rewatch: skipping a
        // credited play must not promote a later one to first watch.
        Assert.Single(plan);
        Assert.Equal("chain-2", plan[0].Play.Id);
        Assert.True(plan[0].IsRewatch);
    }

    [Fact]
    public void ForgettingAUserLetsTheirPlaysCountAgain()
    {
        // What a reset does. Without this the user would be permanently
        // missing every play credited before the reset wiped the counters.
        var ledger = new TracearrCreditLedger(Path_);
        ledger.Remember("u1", new[] { "chain-1" });
        Assert.Single(ledger.For("u1"));

        ledger.Forget("u1");

        Assert.Empty(ledger.For("u1"));
    }

    [Fact]
    public void OneUsersLedgerDoesNotAffectAnother()
    {
        var ledger = new TracearrCreditLedger(Path_);
        ledger.Remember("u1", new[] { "chain-1" });

        Assert.Empty(ledger.For("u2"));
    }

    [Fact]
    public void UserIdsMatchAcrossHyphenAndCase()
    {
        // The same GUID reaches this from the API route, the scan and the
        // profile store in three different shapes. A miss here would silently
        // credit everything twice.
        var ledger = new TracearrCreditLedger(Path_);
        ledger.Remember("5DD06EE5-CED1-4CEE-A5E5-CBC29D2425C4", new[] { "chain-1" });

        Assert.Single(ledger.For("5dd06ee5ced14ceea5e5cbc29d2425c4"));
    }

    [Fact]
    public void TheLedgerSurvivesARestart()
    {
        // It is written to disk for exactly one reason: a restart between two
        // presses must not re-credit everything.
        new TracearrCreditLedger(Path_).Remember("u1", new[] { "chain-1", "chain-2" });

        var reloaded = new TracearrCreditLedger(Path_);

        Assert.Equal(2, reloaded.For("u1").Count);
        Assert.Contains("chain-1", reloaded.For("u1"));
    }

    [Fact]
    public void RememberReportsOnlyWhatWasActuallyNew()
    {
        // So the button can say "nothing new" honestly instead of claiming
        // work it did not do.
        var ledger = new TracearrCreditLedger(Path_);

        Assert.Equal(2, ledger.Remember("u1", new[] { "a", "b" }));
        Assert.Equal(1, ledger.Remember("u1", new[] { "b", "c" }));
        Assert.Equal(0, ledger.Remember("u1", new[] { "a", "b", "c" }));
    }

    [Fact]
    public void ACorruptLedgerDoesNotStopTheServiceStarting()
    {
        File.WriteAllText(Path_, "{ this is not json");

        var ledger = new TracearrCreditLedger(Path_);

        Assert.Empty(ledger.For("u1"));
        Assert.NotNull(ledger.LastPersistError);
    }
}
