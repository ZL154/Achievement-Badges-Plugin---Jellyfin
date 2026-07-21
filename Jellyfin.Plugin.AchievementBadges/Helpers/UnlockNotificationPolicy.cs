using System;
using Jellyfin.Plugin.AchievementBadges.Models;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// Canonical values and matching rules for unlock-toast grouping and device scope.
/// Keeping this policy server-side prevents a crafted client from bypassing a
/// user's originating-device preference by simply omitting its device id.
/// </summary>
public static class UnlockNotificationPolicy
{
    public const string Grouped = "grouped";
    public const string Individual = "individual";
    public const string AllDevices = "all-devices";
    public const string OriginatingDevice = "originating-device";

    public static string NormalizeGrouping(string? value)
        => string.Equals(value?.Trim(), Individual, StringComparison.OrdinalIgnoreCase)
            ? Individual
            : Grouped;

    public static string NormalizeDeviceScope(string? value)
        => string.Equals(value?.Trim(), OriginatingDevice, StringComparison.OrdinalIgnoreCase)
            ? OriginatingDevice
            : AllDevices;

    public static bool ShouldDeliver(AchievementBadge badge, string? scope, string? requestingDeviceId)
    {
        ArgumentNullException.ThrowIfNull(badge);

        if (NormalizeDeviceScope(scope) == AllDevices)
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(requestingDeviceId)
            && !string.IsNullOrWhiteSpace(badge.UnlockDeviceId)
            && string.Equals(
                badge.UnlockDeviceId.Trim(),
                requestingDeviceId.Trim(),
                StringComparison.OrdinalIgnoreCase);
    }
}
