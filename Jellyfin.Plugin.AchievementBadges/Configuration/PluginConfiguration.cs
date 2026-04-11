using System.Collections.Generic;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.AchievementBadges.Configuration;

public class PluginConfiguration : BasePluginConfiguration
{
    public bool Enabled { get; set; } = true;

    public bool ShowOnUserHome { get; set; } = true;

    public bool EnableDebugEndpoints { get; set; } = true;

    public int MinimumPlaySecondsForCompletion { get; set; } = 300;

    public List<string> DisabledBadgeIds { get; set; } = new();

    public List<AchievementDefinition> CustomBadges { get; set; } = new();

    public List<AchievementDefinition> Challenges { get; set; } = new();

    public string? WebhookUrl { get; set; }

    public bool WebhookEnabled { get; set; }

    public string WebhookMessageTemplate { get; set; }
        = "🏆 **{user}** unlocked **{badge}** ({rarity}) — {description}";

    public bool EnableUnlockToasts { get; set; } = true;

    public bool EnableHomeWidget { get; set; } = true;

    public bool EnableItemDetailRibbon { get; set; } = false;
}
