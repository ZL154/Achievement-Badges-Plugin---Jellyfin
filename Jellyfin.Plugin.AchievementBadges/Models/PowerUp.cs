using System;

namespace Jellyfin.Plugin.AchievementBadges.Models;

// v2.0 — Power-up system. Power-ups are consumable boosts a user earns
// (via the daily login bonus, quest completion, or score-shop purchase)
// and spends to accelerate progression. Three types covers the design
// space without inventing currency systems we'd have to balance.
//
// Storage layout: UserAchievementCounters.PowerUpInventory is a
// Dictionary<string, int> keyed by PowerUpType.ToString(). Active state
// (XP-boost window, double-credit pending, streak freeze banked) is
// tracked separately on the counters as small scalar fields so the
// runtime check is O(1) on every credit attempt.

public enum PowerUpType
{
    // Doubles every score gain for the next 60 minutes. Refreshes the
    // timer if re-applied while already active (no stacking, no waste).
    XpBoost,

    // Next item watched counts as +2 toward badge progress instead of
    // +1. Single-use, no expiry — sits in the pending flag until the
    // next item crosses the integrity gate and consumes it.
    DoubleCredit,

    // Auto-consumed when the user misses a day. Protects the watch
    // streak from breaking. Max 1 banked at a time (so the user can't
    // skip a whole week by hoarding freezes).
    StreakFreeze
}

public static class PowerUpDefinitions
{
    public const int MaxInventoryPerType = 20;
    public const int MaxStreakFreezesBanked = 1;
    public const int XpBoostDurationMinutes = 60;
    public const double XpBoostMultiplier = 2.0;
    public const int DoubleCreditMultiplier = 2;

    public static string GetDisplayName(PowerUpType type) => type switch
    {
        PowerUpType.XpBoost      => "XP Boost",
        PowerUpType.DoubleCredit => "Double Credit",
        PowerUpType.StreakFreeze => "Streak Freeze",
        _ => type.ToString()
    };

    public static string GetDescription(PowerUpType type) => type switch
    {
        PowerUpType.XpBoost      => "Double score gains for 60 minutes. Refreshes if reapplied while active.",
        PowerUpType.DoubleCredit => "Your next watched item counts twice toward badge progress.",
        PowerUpType.StreakFreeze => "Auto-protects your watch streak from breaking if you miss a day. Max 1 banked.",
        _ => string.Empty
    };

    public static string GetIcon(PowerUpType type) => type switch
    {
        PowerUpType.XpBoost      => "bolt",
        PowerUpType.DoubleCredit => "filter_2",
        PowerUpType.StreakFreeze => "ac_unit",
        _ => "extension"
    };

    public static bool TryParse(string? raw, out PowerUpType type)
    {
        type = PowerUpType.XpBoost;
        if (string.IsNullOrWhiteSpace(raw)) return false;
        return Enum.TryParse(raw, ignoreCase: true, out type);
    }
}
