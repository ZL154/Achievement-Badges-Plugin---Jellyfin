using System;
using System.Collections.Generic;
using Jellyfin.Plugin.AchievementBadges.Models;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

public static class AchievementScoreHelper
{
    public static int GetScoreForBadge(AchievementBadge badge)
    {
        if (badge is null)
        {
            return 0;
        }

        return GetScoreForRarity(badge.Rarity);
    }

    public static int GetScoreForRarity(string? rarity)
    {
        if (string.IsNullOrWhiteSpace(rarity))
        {
            return 10;
        }

        return rarity.Trim().ToLowerInvariant() switch
        {
            "common" => 10,
            "uncommon" => 20,
            "rare" => 35,
            "epic" => 60,
            "legendary" => 100,
            "mythic" => 150,
            _ => 10
        };
    }

    public static int GetTotalUnlockedScore(IEnumerable<AchievementBadge> badges)
    {
        var total = 0;

        foreach (var badge in badges)
        {
            if (badge.Unlocked)
            {
                total += GetScoreForBadge(badge);
            }
        }

        return total;
    }
}