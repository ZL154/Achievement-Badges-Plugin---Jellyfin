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

    // ─── v2.1.0 "Open Library" — anime detection (issue #25) ──────────
    // Daemon-Network reported that anime badges didn't fire on his
    // library despite items being tagged. Two root causes: (a) v2.0.x
    // only checked Genres, never Tags; (b) Episodes typically don't
    // inherit Genres from their parent Series in Jellyfin's metadata
    // model, so an "Anime"-tagged Series produces episodes with empty
    // genre arrays at playback. v2.1.0 fixes both, AND lets admins
    // configure the heuristic explicitly in case their library shape
    // is unusual.

    /// <summary>Library names that should count every item as anime,
    /// regardless of genres/tags. Default empty — fall back to the
    /// genre/tag substring check. Useful for users who keep a dedicated
    /// "Anime" library and don't tag individual items.</summary>
    public List<string> AnimeLibraries { get; set; } = new();

    /// <summary>Genre substrings (case-insensitive) that classify an item
    /// as anime. Default: ["anime"] (matches "Anime", "Anime Movie", etc).
    /// Add "animation" if you want all animated content counted.</summary>
    public List<string> AnimeGenres { get; set; } = new() { "anime" };

    /// <summary>Tag substrings (case-insensitive) that classify an item
    /// as anime. Default: ["anime"]. Daemon-Network's setup uses Tags
    /// rather than Genres, so reading both was the missing piece.</summary>
    public List<string> AnimeTags { get; set; } = new() { "anime" };

    // ─── v2.1.0 "Open Library" — audiobook counting policy (M2/M3) ────

    /// <summary>How audiobook playback is attributed across the new
    /// Music and Books metrics. Default <see cref="AudiobookCounting.BooksOnly"/>.
    /// Admins who treat audiobooks as a music-flavoured activity (or
    /// want generous double-credit) can switch in settings.</summary>
    public AudiobookCounting AudiobookCounting { get; set; } = AudiobookCounting.BooksOnly;

    // ─── v2.1.0 "Open Library" — issue #27 backfill safety ────────────

    /// <summary>Skip time-windowed badges (Daily / Weekly / Monthly)
    /// during the initial WatchHistoryBackfillService scan. v2.0.x
    /// silently awarded these based on lifetime totals (jojolll's
    /// reproduction in #27 — "Watch 10 films in one day" unlocked when
    /// a user just had 10 films in history). Default true. The M6
    /// admin "Recompute time-windowed badges" tool walks history with
    /// proper day-bucketing for retroactive credit.</summary>
    public bool BackfillSkipTimeWindowedBadges { get; set; } = true;

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

    // Optional page hosts requested in issues #37/#38. The built-in
    // IHasWebPages entry remains registered regardless of these settings.
    public bool EnableCustomTabsIntegration { get; set; } = false;

    public bool EnablePluginPagesIntegration { get; set; } = false;

    public bool EnableUserMenuShortcut { get; set; } = false;

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

    // v1.9.8 — Anti-abuse / integrity controls. These exist because the
    // playback-credit flow used to trust Jellyfin's PlayedToCompletion flag,
    // which a user could trigger by seek-to-end or "Mark as played" without
    // actually watching. The bug itself is fixed in v1.9.8 by per-session
    // tick accumulation in PlaybackCompletionTracker, but these caps are
    // defense in depth + visibility for admins.

    // Daily soft cap on credited items per user. Real users watching real
    // content never hit this; bot-clickers and exploit-spammers get capped.
    public bool EnableDailyCreditCap { get; set; } = true;
    public int DailyCreditCap { get; set; } = 200;

    // If the user crosses this many credited items in a rolling 60-minute
    // window, emit a "suspicious_rate" entry to the audit log so admins can
    // investigate. Does NOT block the credit — visibility only. Throttled
    // to one entry per user per hour so a single burst doesn't spam.
    public bool EnableSuspiciousActivityFlag { get; set; } = true;
    public int SuspiciousRatePerHour { get; set; } = 30;
}
