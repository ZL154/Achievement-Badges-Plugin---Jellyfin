using System;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// The weekly "Daily Dedication" quest asks the user to maintain a five day
/// watch streak, and quest progress is the metric minus the value captured
/// when the period began. Reading <c>BestWatchStreak</c> instead of the live
/// streak makes that impossible for anyone with an established record: the
/// all-time best only rises above its own captured value on a new personal
/// record, so a user watching every day sees 0 progress indefinitely.
/// </summary>
public class QuestMetricTests
{
    private static UserAchievementCounters WithWatchDates(params string[] dates)
    {
        var counters = new UserAchievementCounters();
        foreach (var d in dates)
        {
            counters.WatchDates.Add(d);
        }

        return counters;
    }

    [Fact]
    public void CurrentWatchStreak_ReflectsTheLiveStreak_NotTheAllTimeBest()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var counters = WithWatchDates(
            today.AddDays(-3).ToString("yyyy-MM-dd"),
            today.AddDays(-2).ToString("yyyy-MM-dd"),
            today.AddDays(-1).ToString("yyyy-MM-dd"),
            today.ToString("yyyy-MM-dd"));

        // An old record far above the current run: the value the quest used to
        // read, and the reason progress stayed at zero.
        counters.BestWatchStreak = 42;

        var live = AchievementBadgeService.GetCurrentWatchStreak(counters);

        Assert.Equal(4, live);
        Assert.NotEqual(counters.BestWatchStreak, live);
    }

    [Fact]
    public void StreakRunsFromTheMostRecentDay_AndStopsAtTheFirstGap()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var counters = WithWatchDates(
            today.AddDays(-9).ToString("yyyy-MM-dd"),  // isolated, before the gap
            today.AddDays(-3).ToString("yyyy-MM-dd"),
            today.AddDays(-2).ToString("yyyy-MM-dd"),
            today.AddDays(-1).ToString("yyyy-MM-dd"));
        counters.BestWatchStreak = 40;

        // Three consecutive days ending yesterday. The isolated day nine days
        // back is on the far side of a gap and does not extend it, and the
        // stale record does not inflate it.
        Assert.Equal(3, AchievementBadgeService.GetCurrentWatchStreak(counters));
    }

    [Fact]
    public void DuplicateDates_DoNotInflateTheStreak()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var counters = WithWatchDates(
            today.AddDays(-1).ToString("yyyy-MM-dd"),
            today.ToString("yyyy-MM-dd"));

        Assert.Equal(2, AchievementBadgeService.GetCurrentWatchStreak(counters));
    }

    [Fact]
    public void NoWatchDates_ReportsZero_EvenWithARecord()
    {
        var counters = new UserAchievementCounters { BestWatchStreak = 12 };

        Assert.Equal(0, AchievementBadgeService.GetCurrentWatchStreak(counters));
    }
}
