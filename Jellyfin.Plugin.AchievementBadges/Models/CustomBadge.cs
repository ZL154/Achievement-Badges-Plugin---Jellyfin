using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Models;

/// <summary>
/// [v2.1.0 "Open Library" M4] Admin-defined badge. Stored in a sidecar
/// JSON (NOT in PluginConfiguration.xml — custom badges can churn
/// frequently and we don't want every edit triggering a full plugin-
/// config save). Evaluated by <c>AchievementBadgeService.EvaluateBadges</c>
/// alongside the built-in <see cref="AchievementDefinition"/> catalog.
///
/// Compound criteria (AND / OR expression tree) lets admins build
/// nuanced unlocks that the built-in catalog can't express — e.g.
/// "Watch 100 films AND listen to 50 music tracks" or "Complete 5
/// horror series OR listen to 10 hours of audiobooks". Single-criterion
/// badges are a degenerate compound: a leaf node with no Operator /
/// Children, just <c>Metric</c> + <c>Threshold</c>.
///
/// Icon: either hosted (<see cref="IconIsHosted"/> = true, IconUrl points
/// at <c>/Plugins/AchievementBadges/custom-icons/{filename}</c> for files
/// uploaded by the admin and served from the plugin data folder) or an
/// external URL the admin pasted. The custom-icons upload endpoint
/// is M7-polish; M4 ships URL-only.
/// </summary>
public class CustomBadge
{
    /// <summary>Stable opaque id. New badges get a fresh Guid "N" format.
    /// Persists across edits so user-profile unlock records stay linked.</summary>
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    /// <summary>Icon source. Either an absolute external URL (https://...)
    /// or a relative path on this Jellyfin host's plugin-icon endpoint
    /// (<c>/Plugins/AchievementBadges/custom-icons/{filename}</c>) when
    /// <see cref="IconIsHosted"/> is true. Empty string = use a generic
    /// fallback icon at render time.</summary>
    public string IconUrl { get; set; } = string.Empty;

    /// <summary>True when <see cref="IconUrl"/> refers to a file the admin
    /// uploaded and the plugin is hosting on disk. False when it's an
    /// external URL the admin pasted. Affects how the admin UI renders
    /// the "edit icon" affordance (replace vs. paste new URL).</summary>
    public bool IconIsHosted { get; set; }

    public string Rarity { get; set; } = "Common";

    /// <summary>Which media tab the badge appears under in the user UI.
    /// <c>Multi</c> for badges whose criteria span media types.</summary>
    public MediaType Media { get; set; } = MediaType.Multi;

    /// <summary>If set, badge participates in the M1/M6
    /// time-window-skip-during-backfill machinery. Defaults to null
    /// (lifetime-cumulative).</summary>
    public BadgeTimeWindow? TimeWindow { get; set; }

    /// <summary>Compound criteria tree. Root node is required; can be
    /// a leaf (single metric+threshold) or compound (And/Or with
    /// children). See <see cref="CustomBadgeCriteria"/> for evaluation
    /// semantics.</summary>
    public CustomBadgeCriteria Criteria { get; set; } = new();

    /// <summary>When the badge was first created. Useful for admin
    /// audit + display.</summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>UserId of the admin who created the badge. Display-only;
    /// no permission impact (any admin can edit any custom badge).</summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>Master kill switch. Disabled badges are persisted but
    /// not evaluated and don't appear in user UIs. Admins can disable
    /// rather than delete to preserve the definition for later.</summary>
    public bool Enabled { get; set; } = true;
}

/// <summary>
/// [v2.1.0 "Open Library" M4] Expression-tree node for custom badge
/// criteria. A node is EITHER:
/// <list type="bullet">
///   <item>A LEAF: <see cref="Metric"/> + <see cref="Threshold"/> set,
///         <see cref="Operator"/> + <see cref="Children"/> null/empty.
///         True when the metric value meets or exceeds the threshold.</item>
///   <item>A COMPOUND: <see cref="Operator"/> set,
///         <see cref="Children"/> non-empty. True when the operator
///         (And/Or) applied to the children's evaluations is true.</item>
/// </list>
/// Validation lives in <c>CustomBadgeService</c>: leaf nodes must have
/// non-null Metric+Threshold; compound nodes must have at least one
/// child; trees deeper than 5 levels are rejected to bound evaluation
/// cost.
/// </summary>
public class CustomBadgeCriteria
{
    /// <summary>Leaf node: the metric to evaluate against. Null on
    /// compound nodes.</summary>
    public AchievementMetric? Metric { get; set; }

    /// <summary>Leaf node: optional parameter for parameterized metrics
    /// like <c>GenreItemsWatched</c> (parameter = genre name),
    /// <c>StudioItemsWatched</c> (= studio name),
    /// <c>LibraryCompletionPercent</c> (= library name). Null otherwise.</summary>
    public string? MetricParameter { get; set; }

    /// <summary>Leaf node: integer threshold the metric must reach.
    /// Null on compound nodes.</summary>
    public int? Threshold { get; set; }

    /// <summary>Compound node: how children combine. Null on leaf nodes.</summary>
    public CompoundOperator? Operator { get; set; }

    /// <summary>Compound node: ordered children. Empty/null on leaf nodes.</summary>
    public List<CustomBadgeCriteria>? Children { get; set; }
}

/// <summary>[v2.1.0 "Open Library" M4] Boolean combinator for compound
/// criteria nodes.</summary>
public enum CompoundOperator
{
    And = 0,
    Or = 1,
}
