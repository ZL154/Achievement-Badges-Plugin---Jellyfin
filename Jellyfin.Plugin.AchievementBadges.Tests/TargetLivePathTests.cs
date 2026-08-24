using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Services;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #107. Targeted badges have the same failure shape the discography
/// badges had before 3c23df4: one writer, reachable only from the watch
/// history scan, so finishing a series live never moved the badge and the
/// symptom was a progress bar quietly stuck at its last scanned value. This
/// pins the dependency that makes the live path reachable at all.
/// </summary>
public class TargetLivePathTests
{
    [Fact]
    public void TheTrackerCanReachTheTargetProgressService()
    {
        var constructor = typeof(PlaybackCompletionTracker).GetConstructors().Single();

        Assert.Contains(
            constructor.GetParameters(),
            p => p.ParameterType == typeof(TargetProgressService));
    }

    [Fact]
    public void TheBackfillCanReachTheTargetProgressService()
    {
        // The scan is the reconciler: it is the only pass that recomputes
        // targets the live path never sees, including every target for a user
        // who has not played anything since the badge was authored.
        var constructor = typeof(WatchHistoryBackfillService).GetConstructors().Single();

        Assert.Contains(
            constructor.GetParameters(),
            p => p.ParameterType == typeof(TargetProgressService));
    }
}
