using System;
using Jellyfin.Plugin.AchievementBadges.Models;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

public static class AchievementDefinitionSanitizer
{
    public static AchievementDefinition Sanitize(AchievementDefinition def)
    {
        if (def == null) return new AchievementDefinition();
        def.Id = Trim(def.Id, 128);
        def.Key = Trim(def.Key, 128);
        def.Title = Trim(def.Title ?? "", 200);
        def.Description = Trim(def.Description ?? "", 2000);
        def.Icon = Trim(def.Icon ?? "emoji_events", 64);
        def.Category = Trim(def.Category ?? "General", 64);
        def.Rarity = Trim(def.Rarity ?? "Common", 32);
        def.MetricParameter = Trim(def.MetricParameter ?? "", 256);
        if (def.TargetValue < 1) def.TargetValue = 1;
        if (def.TargetValue > 1_000_000) def.TargetValue = 1_000_000;
        if (!Enum.IsDefined(def.Metric)) def.Metric = default;
        return def;
    }

    public static AchievementBadge Sanitize(AchievementBadge b)
    {
        if (b == null) return new AchievementBadge();
        b.Id = Trim(b.Id, 128);
        b.Title = Trim(b.Title ?? "", 200);
        b.Description = Trim(b.Description ?? "", 2000);
        b.Icon = Trim(b.Icon ?? "emoji_events", 64);
        b.Category = Trim(b.Category ?? "General", 64);
        b.Rarity = Trim(b.Rarity ?? "Common", 32);
        if (b.TargetValue < 1) b.TargetValue = 1;
        if (b.TargetValue > 1_000_000) b.TargetValue = 1_000_000;
        if (b.CurrentValue < 0) b.CurrentValue = 0;
        return b;
    }

    private static string Trim(string? s, int max)
    {
        if (string.IsNullOrEmpty(s)) return s ?? "";
        return s.Length > max ? s.Substring(0, max) : s;
    }
}
