using System;
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
}
