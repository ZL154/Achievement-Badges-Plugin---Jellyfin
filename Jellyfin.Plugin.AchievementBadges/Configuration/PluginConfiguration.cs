using System.Collections.Generic;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.AchievementBadges.Configuration;

public class PluginConfiguration : BasePluginConfiguration
{
    public bool Enabled { get; set; } = true;

    public bool ShowOnUserHome { get; set; } = true;

    public bool EnableDebugEndpoints { get; set; } = false;

    public int MinimumPlaySecondsForCompletion { get; set; } = 300;

    public List<string> DisabledBadgeIds { get; set; } = new();

    public List<AchievementDefinition> CustomBadges { get; set; } = new();

    public List<AchievementDefinition> Challenges { get; set; } = new();

    public string? WebhookUrl { get; set; }

    public bool WebhookEnabled { get; set; }

    public string WebhookMessageTemplate { get; set; }
        = "🏆 **{user}** unlocked **{badge}** ({rarity}) — {description}";

    // v1.8.59 (A+): HMAC-SHA256 signing secret for outbound webhook POSTs.
    // When set, every webhook body is signed and the signature is sent in:
    //   X-AchievementBadges-Signature: sha256=<hex>
    //   X-AchievementBadges-Timestamp: <unix-seconds>
    // Receivers can verify with HMAC(secret, "<timestamp>." + raw_body) to
    // confirm the message wasn't forged by anyone who happened to grab the
    // webhook URL. Same pattern as Stripe / GitHub. Empty = don't sign
    // (preserves legacy behaviour for users who haven't generated one yet).
    public string WebhookSigningSecret { get; set; } = string.Empty;

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

    // Default UI language when a user hasn't picked one. Supported:
    // "en", "fr", "es", "de", "it", "pt", "zh", "ja".
    public string DefaultLanguage { get; set; } = "en";

    // Admin-supplied SVG used to replace the Xbox logo in the toast animation.
    // Stored as a base64-encoded SVG string (no data:-URI prefix). Empty string
    // means "use the default Xbox logo bundled with the plugin".
    public string CustomXboxLogoSvg { get; set; } = "";

    // When true, audit log entries store only the UserId GUID, not UserName.
    // The admin endpoint returns "[redacted]" for the UserName of any entry
    // that was stored with redaction on.
    public bool RedactUsernamesInAuditLog { get; set; } = false;

    // Admin force-override for the equipped-badge showcase UI (sidebar strip,
    // header dots, profile-card equipped slots). When true, these elements are
    // hidden for all users regardless of per-user preferences. Default false.
    public bool ForceHideEquippedShowcase { get; set; } = false;

    // Admin-authored quest templates. Merged with the built-in DailyTemplates /
    // WeeklyTemplates at quest-pick time. Ids must be unique across both
    // built-in and custom; built-in quests with the same Id are replaced.
    public List<QuestDefinition> CustomDailyQuests { get; set; } = new();
    public List<QuestDefinition> CustomWeeklyQuests { get; set; } = new();

    // Built-in quest template Ids the admin has disabled. Entries in either
    // CustomDailyQuests / CustomWeeklyQuests are still eligible.
    public List<string> DisabledQuestIds { get; set; } = new();

    // Friends feature master switches (v1.7.11+)
    // When false, the floating button + drawer don't mount at all and the
    // friends API endpoints return empty responses.
    public bool FriendsEnabled { get; set; } = true;

    // When true, swap the drawer's Friends/Requests/Find tabs for a single
    // list of every user on the server — useful on small family servers
    // where the request/accept flow is friction that nobody needs.
    public bool FriendsSimpleMode { get; set; } = false;
}
