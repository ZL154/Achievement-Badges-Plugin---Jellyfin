using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Models;

// v2.0 — Cosmetic catalog. Cosmetics are purely visual unlocks bought
// from the score shop (or earned at score milestones). Three categories:
// profile themes (recolor the achievements page hero), badge frames
// (decorate the equipped-badge showcase strip), and custom rank titles
// (replace the auto-generated tier name on profile cards).
//
// Catalog lives in code (Services/ShopService.cs) so admins don't have
// to author JSON to add cosmetics; the trade-off is that adding new
// cosmetics requires a new release. Cosmetics are referenced by ID;
// the rendering layer maps the ID to its CSS/asset.

public enum CosmeticKind
{
    ProfileTheme,
    BadgeFrame,
    RankTitle,
    // v2.0: avatar emoji/icon shown next to the rank label in the hero card.
    // The "Id" of an Avatar cosmetic encodes the emoji or material-icon name
    // the standalone page substitutes for the default 🏅.
    Avatar,
    // v2.0.x: animated CSS background layer painted behind the page content
    // (black hole, starfield, nebula, …). Each id maps to a CSS animation
    // rule shipped by injectStyles().
    Background,
    // v2.0.x: animated border + glow applied to the profile hero card so it
    // gets a Steam-showcase-tier flourish that complements the theme.
    ProfileBorder
}

public class CosmeticItem
{
    public string Id { get; set; } = string.Empty;
    public CosmeticKind Kind { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Price in score. Some cosmetics auto-unlock at a score milestone
    // even if they're listed in the shop (e.g. "Curator" title at 5000
    // score) — the milestone bypasses the score-deduction step.
    public int PriceScore { get; set; }

    // If set, the user auto-owns this cosmetic the moment their score
    // reaches MilestoneScore. Set to 0/null to require explicit purchase.
    public int? MilestoneScore { get; set; }

    // Optional preview metadata for the shop card UI.
    public string PreviewColor { get; set; } = string.Empty;
    public string PreviewIcon { get; set; } = string.Empty;
}

public class ShopPowerUpItem
{
    public PowerUpType Type { get; set; }
    public string Id { get; set; } = string.Empty;       // "powerup-xp-boost" etc.
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int PriceScore { get; set; }
    public int BundleSize { get; set; } = 1;             // some bundles give 3 for a discount
}

public class ShopCatalog
{
    public List<ShopPowerUpItem> PowerUps { get; set; } = new();
    public List<CosmeticItem> Cosmetics { get; set; } = new();
}

public class ShopPurchaseRequest
{
    public string ItemId { get; set; } = string.Empty;
}

public class ShopPurchaseResult
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public int? ScoreBalanceAfter { get; set; }
    public int? PowerUpInventoryAfter { get; set; }
    public string? OwnedCosmeticId { get; set; }
}
