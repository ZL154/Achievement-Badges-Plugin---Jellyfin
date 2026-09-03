namespace Jellyfin.Plugin.AchievementBadges.Models;

/// <summary>
/// [issue #42] The equipped shop cosmetics a user shows to other people:
/// the custom rank title and the badge frame. Resolved against the shop
/// catalog, so a stale or unknown id comes back as null instead of leaking
/// into markup, and gated by the same privacy toggles as the equipped badge
/// preview: a user who hid their showcase shows no bling either.
/// <para>
/// The profile theme is not here on purpose. The shareable card skins are
/// drawn in the rank tier's colour, and painting them in the user's theme
/// is a redesign of the three templates rather than a projection of data.
/// </para>
/// </summary>
public sealed class PublicCosmetics
{
    /// <summary>Display name of the equipped custom title (for example
    /// "Tastemaker"), or null when none is equipped or the id is not in the
    /// catalog.</summary>
    public string? CustomTitle { get; init; }

    /// <summary>Catalog id of the equipped badge frame (for example
    /// "frame-gilded"), or null for the default frame, an unknown id, or a
    /// hidden showcase. Safe to use as a CSS class: it can only be an id
    /// that exists in the catalog.</summary>
    public string? BadgeFrameId { get; init; }

    public static PublicCosmetics None { get; } = new();
}
