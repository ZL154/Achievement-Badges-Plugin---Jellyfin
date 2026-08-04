using System;
using Jellyfin.Plugin.AchievementBadges;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Watch time must survive a stream that drops and reconnects mid-item.
/// <para>
/// Jellyfin hands a reconnecting client a new session id, and the per-session
/// accumulator is keyed by that id, so everything watched before the break was
/// discarded. The trigger is ordinary: when a transcode stalls the client stops
/// and restarts on its own within seconds, which the viewer sees as buffering.
/// A full viewing then arrives as two halves and neither reaches the credit
/// threshold, so nothing is credited at all.
/// </para>
/// </summary>
public class WatchCarryTests
{
    private const string User = "5dd06ee5-ced1-4cee-a5e5-cbc29d2425c4";
    private const string Item = "22f1b2e0-72af-4c24-7bbb-e09d1c6e5042";

    private static readonly DateTimeOffset Now = new(2026, 8, 2, 23, 30, 0, TimeSpan.Zero);

    private static long Seconds(int s) => s * TimeSpan.TicksPerSecond;

    [Fact]
    public void BrokenStream_IsMeasuredAsOneViewing_NotTwoHalves()
    {
        // The real incident: a 3777s episode watched in full, split by a
        // transcode stall into 1664s and 2234s. Eighteen seconds passed
        // between the two sessions.
        const long runtime = 3777L * TimeSpan.TicksPerSecond;
        var store = new WatchCarryStore();

        var firstSession = Seconds(1664);
        Assert.Equal(0, store.Peek(User, Item, Now));
        Assert.True(firstSession * 100d / runtime < 80d, "the first half alone must not reach the threshold");
        store.Remember(User, Item, firstSession, Now);

        var reconnect = Now.AddSeconds(18);
        var secondSession = Seconds(2234);
        Assert.True(secondSession * 100d / runtime < 80d, "the second half alone must not reach the threshold either");

        var total = secondSession + store.Peek(User, Item, reconnect);
        var completion = total * 100d / runtime;

        Assert.True(completion >= 80d, $"the full viewing must credit, got {completion:0.##}%");
        Assert.True(completion > 100d, "1664s plus 2234s exceeds the 3777s runtime");
    }

    [Fact]
    public void CreditedItem_StartsFromZeroOnTheNextViewing()
    {
        var store = new WatchCarryStore();
        store.Remember(User, Item, Seconds(1664), Now);
        Assert.Equal(Seconds(1664), store.Peek(User, Item, Now));

        store.Clear(User, Item);

        Assert.Equal(0, store.Peek(User, Item, Now.AddMinutes(1)));
    }

    [Fact]
    public void CarryExpires_SoAnUnrelatedViewingStartsClean()
    {
        var store = new WatchCarryStore(TimeSpan.FromHours(6));
        store.Remember(User, Item, Seconds(1664), Now);

        Assert.Equal(Seconds(1664), store.Peek(User, Item, Now.AddHours(5)));
        Assert.Equal(0, store.Peek(User, Item, Now.AddHours(7)));
    }

    [Fact]
    public void ExpiredEntries_ArePrunedInsteadOfAccumulating()
    {
        var store = new WatchCarryStore(TimeSpan.FromHours(6));
        for (var i = 0; i < 25; i++)
        {
            store.Remember(User, "item-" + i, Seconds(60), Now);
        }

        Assert.Equal(25, store.Count);

        store.Peek(User, "anything", Now.AddHours(7));

        Assert.Equal(0, store.Count);
    }

    [Fact]
    public void CarryIsPerUserAndItem()
    {
        var store = new WatchCarryStore();
        store.Remember(User, Item, Seconds(1000), Now);

        Assert.Equal(0, store.Peek("99999999-9999-9999-9999-999999999999", Item, Now));
        Assert.Equal(0, store.Peek(User, "another-item", Now));
        Assert.Equal(Seconds(1000), store.Peek(User, Item, Now));
    }

    [Fact]
    public void NonPositiveTicks_DoNotCreateAnEntry()
    {
        var store = new WatchCarryStore();
        store.Remember(User, Item, 0, Now);

        Assert.Equal(0, store.Count);
    }

    // ─── A long item watched across the day, not across a reconnect ───────
    //
    // The reconnect case above spans seconds. The pattern that actually costs
    // users their credit spans hours: a two-hour episode watched in pieces
    // between other things. A six-hour window was sized for the reconnect and
    // silently drops these, so an item genuinely watched end to end is refused.

    private const string LongItem = "95a4e374-411e-2fa2-c601-116b4b59a10e";

    [Fact]
    public void ItemWatchedInPiecesAcrossTheDay_StillCredits()
    {
        // Real timeline: a 8283s episode, five sittings from 09:47 to 21:01.
        const long runtime = 8283L * TimeSpan.TicksPerSecond;
        var store = new WatchCarryStore();
        var morning = new DateTimeOffset(2026, 8, 3, 9, 47, 0, TimeSpan.Zero);

        store.Remember(User, LongItem, Seconds(1105), morning);
        store.Remember(User, LongItem, Seconds(2554), morning.AddHours(1.5));
        store.Remember(User, LongItem, Seconds(2957), morning.AddHours(2.6));
        store.Remember(User, LongItem, Seconds(4426), morning.AddHours(4.4));

        // The last sitting ended 6h49m after the one before it.
        var lastStop = morning.AddHours(11.2);
        var carried = store.Peek(User, LongItem, lastStop);
        var total = carried + Seconds(5000);

        Assert.True(
            total * 100d / runtime >= 80d,
            $"an episode watched to the end across the day must credit, got {total * 100d / runtime:0.##}%");
    }

    [Fact]
    public void SixHourWindow_WasTooShortForThatPattern()
    {
        // Pins why the default changed: the same timeline under the old window
        // discards everything watched before the gap.
        var store = new WatchCarryStore(TimeSpan.FromHours(6));
        var start = new DateTimeOffset(2026, 8, 3, 14, 12, 0, TimeSpan.Zero);
        store.Remember(User, LongItem, Seconds(4426), start);

        Assert.Equal(0, store.Peek(User, LongItem, start.AddHours(6.82)));
    }

    [Fact]
    public void DefaultWindow_CoversAnItemLeftAndResumedDaysLater()
    {
        // Also real: one episode spread over 29/07, 30/07 and 01/08.
        var store = new WatchCarryStore();
        store.Remember(User, LongItem, Seconds(3000), Now);

        Assert.Equal(Seconds(3000), store.Peek(User, LongItem, Now.AddDays(3)));
        Assert.Equal(Seconds(3000), store.Peek(User, LongItem, Now.AddDays(6)));
        Assert.Equal(0, store.Peek(User, LongItem, Now.AddDays(8)));
    }

    // ─── Surviving a restart ──────────────────────────────────────────────
    //
    // The store lived only in memory, so restarting Jellyfin threw away every
    // partial viewing on the server. Over a window measured in days that is no
    // longer an acceptable loss.

    private static string TempFile() =>
        System.IO.Path.Combine(System.IO.Path.GetTempPath(), "ab-carry-" + Guid.NewGuid().ToString("N") + ".json");

    // Reading the file back drops entries that expired while the server was
    // down, and it can only judge that against the real clock. These cases are
    // therefore anchored to now rather than to a fixed date, which would start
    // failing on its own once the date fell outside the window.
    private static readonly DateTimeOffset Recently = DateTimeOffset.UtcNow.AddHours(-1);

    [Fact]
    public void Carry_SurvivesARestart()
    {
        var path = TempFile();
        try
        {
            var before = new WatchCarryStore(persistPath: path);
            before.Remember(User, LongItem, Seconds(4426), Recently);

            var afterRestart = new WatchCarryStore(persistPath: path);

            Assert.Equal(Seconds(4426), afterRestart.Peek(User, LongItem, Recently.AddHours(8)));
        }
        finally
        {
            System.IO.File.Delete(path);
        }
    }

    [Fact]
    public void RestartDoesNotResurrectExpiredCarry()
    {
        var path = TempFile();
        try
        {
            var before = new WatchCarryStore(TimeSpan.FromHours(6), path);
            before.Remember(User, LongItem, Seconds(4426), Recently.AddHours(-9));

            var afterRestart = new WatchCarryStore(TimeSpan.FromHours(6), path);

            Assert.Equal(0, afterRestart.Peek(User, LongItem, Recently));
            Assert.Equal(0, afterRestart.Count);
        }
        finally
        {
            System.IO.File.Delete(path);
        }
    }

    [Fact]
    public void CreditedItem_StaysClearedAcrossARestart()
    {
        var path = TempFile();
        try
        {
            var before = new WatchCarryStore(persistPath: path);
            before.Remember(User, LongItem, Seconds(4426), Recently);
            before.Clear(User, LongItem);

            var afterRestart = new WatchCarryStore(persistPath: path);

            Assert.Equal(0, afterRestart.Peek(User, LongItem, Recently));
        }
        finally
        {
            System.IO.File.Delete(path);
        }
    }

    [Fact]
    public void RetentionDefaultsToSevenDays()
    {
        Assert.Equal(7, new Configuration.PluginConfiguration().WatchCarryRetentionDays);
    }

    [Fact]
    public void UnreadableCarryFile_StartsEmptyInsteadOfThrowing()
    {
        var path = TempFile();
        try
        {
            System.IO.File.WriteAllText(path, "{ this is not json");

            var store = new WatchCarryStore(persistPath: path);

            Assert.Equal(0, store.Count);
            store.Remember(User, LongItem, Seconds(60), Recently);
            Assert.Equal(Seconds(60), new WatchCarryStore(persistPath: path).Peek(User, LongItem, Recently));
        }
        finally
        {
            System.IO.File.Delete(path);
        }
    }
}
