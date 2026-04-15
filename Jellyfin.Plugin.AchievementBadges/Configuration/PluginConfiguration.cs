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

    public bool EnableHomeWidget { get; set; } = false;

    public bool EnableItemDetailRibbon { get; set; } = false;

    // Feature kill switches
    public bool LeaderboardEnabled { get; set; } = true;
    public bool CompareEnabled { get; set; } = true;
    public bool ActivityFeedEnabled { get; set; } = true;
    public bool PrestigeEnabled { get; set; } = true;
    public bool QuestsEnabled { get; set; } = true;
    public bool ForcePrivacyMode { get; set; } = false;
    public bool ForceSpoilerMode { get; set; } = false;
    public bool ForceExtremeSpoilerMode { get; set; } = false;

    // Badge controls
    public int MaxEquippedBadges { get; set; } = 5;
    public bool RestrictBadgeVisibility { get; set; } = false;
    public List<string> DisabledBadgeCategories { get; set; } = new();
    public string WelcomeMessage { get; set; } = "";

    // Default UI language when a user hasn't picked one. Supported: "en", "fr", "es".
    public string DefaultLanguage { get; set; } = "en";
}
