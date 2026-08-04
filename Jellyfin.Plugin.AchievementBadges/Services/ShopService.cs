using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Models;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// v2.0 - Score Shop. Two-currency-free design: spend score on power-up
/// refills, profile themes, badge frames, and custom rank titles.
/// Catalog is in-code so the wire format is stable; adding a cosmetic
/// requires a release. Auto-unlock at score milestones bypasses
/// purchase but still routes through this service so the audit trail
/// and ownership semantics are consistent.
/// </summary>
public class ShopService
{
    private readonly PowerUpService _powerUps;
    private readonly ILogger<ShopService> _logger;

    public ShopService(PowerUpService powerUps, ILogger<ShopService> logger)
    {
        _powerUps = powerUps;
        _logger = logger;
    }

    // -------------------------------------------------------------------
    // Catalog - hand-curated. Power-ups single + bundle. Cosmetics by
    // kind. Pricing chosen to be reachable but meaningful for an active
    // user (most users earn 100-500 score/week from passive playback;
    // cheap cosmetics are 1-2 weeks of play, premium milestone titles
    // are months).

    private static readonly List<ShopPowerUpItem> _powerUpItems = new()
    {
        new ShopPowerUpItem
        {
            Type = PowerUpType.XpBoost, Id = "pu-xp-boost-1",
            DisplayName = "XP Boost", BundleSize = 1, PriceScore = 50,
            Description = "Double score gains for 60 minutes. Refreshes timer if reapplied."
        },
        new ShopPowerUpItem
        {
            Type = PowerUpType.XpBoost, Id = "pu-xp-boost-3",
            DisplayName = "XP Boost 3-pack", BundleSize = 3, PriceScore = 130,
            Description = "3x XP Boost. Saves 20 score over single purchases."
        },
        new ShopPowerUpItem
        {
            Type = PowerUpType.DoubleCredit, Id = "pu-double-credit-1",
            DisplayName = "Double Credit", BundleSize = 1, PriceScore = 75,
            Description = "Your next watched item counts twice toward badge progress."
        },
        new ShopPowerUpItem
        {
            Type = PowerUpType.DoubleCredit, Id = "pu-double-credit-3",
            DisplayName = "Double Credit 3-pack", BundleSize = 3, PriceScore = 200,
            Description = "3x Double Credit. Saves 25 score over single purchases."
        },
        new ShopPowerUpItem
        {
            Type = PowerUpType.StreakFreeze, Id = "pu-streak-freeze-1",
            DisplayName = "Streak Freeze", BundleSize = 1, PriceScore = 100,
            Description = "Auto-protect your watch streak from one missed day. Max 1 banked."
        }
    };

    private static readonly List<CosmeticItem> _cosmeticItems = new()
    {
        // ---- Profile themes (5) ----
        new CosmeticItem
        {
            Id = "theme-default", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Default", Description = "The classic dark Jellyfin look.",
            PriceScore = 0, MilestoneScore = 0,
            PreviewColor = "#1f2937", PreviewIcon = "palette"
        },
        new CosmeticItem
        {
            Id = "theme-sunset", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Sunset", Description = "Warm orange-pink gradient hero.",
            PriceScore = 250,
            PreviewColor = "#f97316", PreviewIcon = "wb_twilight"
        },
        new CosmeticItem
        {
            Id = "theme-cyberpunk", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Cyberpunk", Description = "Neon magenta + cyan with subtle scanlines.",
            PriceScore = 350,
            PreviewColor = "#a855f7", PreviewIcon = "videogame_asset"
        },
        new CosmeticItem
        {
            Id = "theme-pastel", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Pastel", Description = "Soft lilac + mint hero with low-contrast accents.",
            PriceScore = 200,
            PreviewColor = "#a78bfa", PreviewIcon = "spa"
        },
        new CosmeticItem
        {
            Id = "theme-monochrome", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Monochrome", Description = "Pure black + white with thin accent lines.",
            PriceScore = 500,
            PreviewColor = "#ffffff", PreviewIcon = "contrast"
        },
        new CosmeticItem
        {
            Id = "theme-noir", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Noir", Description = "Charcoal + sepia. Detective-movie ambience.",
            PriceScore = 400,
            PreviewColor = "#78716c", PreviewIcon = "movie"
        },
        new CosmeticItem
        {
            Id = "theme-aurora", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Aurora", Description = "Emerald + indigo aurora gradient.",
            PriceScore = 450,
            PreviewColor = "#10b981", PreviewIcon = "auto_awesome"
        },
        new CosmeticItem
        {
            Id = "theme-crimson", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Crimson", Description = "Deep blood-red with smoky undertones.",
            PriceScore = 350,
            PreviewColor = "#dc2626", PreviewIcon = "local_fire_department"
        },
        new CosmeticItem
        {
            Id = "theme-vaporwave", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Vaporwave", Description = "Hot pink + teal '80s mall vibes.",
            PriceScore = 550,
            PreviewColor = "#ec4899", PreviewIcon = "blur_on"
        },

        // ---- Badge frames (4) ----
        new CosmeticItem
        {
            Id = "frame-default", Kind = CosmeticKind.BadgeFrame,
            DisplayName = "Default", Description = "The standard rounded square frame.",
            PriceScore = 0, MilestoneScore = 0,
            PreviewIcon = "crop_square"
        },
        new CosmeticItem
        {
            Id = "frame-gilded", Kind = CosmeticKind.BadgeFrame,
            DisplayName = "Gilded", Description = "Gold-edged frame with a subtle glow.",
            PriceScore = 300,
            PreviewColor = "#facc15", PreviewIcon = "auto_awesome"
        },
        new CosmeticItem
        {
            Id = "frame-holo", Kind = CosmeticKind.BadgeFrame,
            DisplayName = "Holographic", Description = "Iridescent gradient that shifts on hover.",
            PriceScore = 400,
            PreviewColor = "#22d3ee", PreviewIcon = "blur_on"
        },
        new CosmeticItem
        {
            Id = "frame-frosted", Kind = CosmeticKind.BadgeFrame,
            DisplayName = "Frosted", Description = "Crystalline edges + cool blue accent.",
            PriceScore = 300,
            PreviewColor = "#bfdbfe", PreviewIcon = "ac_unit"
        },
        new CosmeticItem
        {
            Id = "frame-obsidian", Kind = CosmeticKind.BadgeFrame,
            DisplayName = "Obsidian", Description = "Inky volcanic glass edge with red ember glow.",
            PriceScore = 350,
            PreviewColor = "#0c0a09", PreviewIcon = "diamond"
        },
        new CosmeticItem
        {
            Id = "frame-emerald", Kind = CosmeticKind.BadgeFrame,
            DisplayName = "Emerald", Description = "Polished jade rim — for the masters.",
            PriceScore = 500,
            PreviewColor = "#10b981", PreviewIcon = "spa"
        },
        new CosmeticItem
        {
            Id = "frame-neon", Kind = CosmeticKind.BadgeFrame,
            DisplayName = "Neon", Description = "Hot-pink electric outline. Synth-wave vibes.",
            PriceScore = 350,
            PreviewColor = "#ec4899", PreviewIcon = "auto_awesome"
        },

        // ---- Custom rank titles (6) ----
        // Three score-milestone unlocks (auto-own); three shop-only.
        new CosmeticItem
        {
            Id = "title-cinephile", Kind = CosmeticKind.RankTitle,
            DisplayName = "Cinephile", Description = "Auto-unlocks at 1,000 lifetime score.",
            PriceScore = 0, MilestoneScore = 1000,
            PreviewIcon = "movie_filter"
        },
        new CosmeticItem
        {
            Id = "title-marathoner", Kind = CosmeticKind.RankTitle,
            DisplayName = "Marathoner", Description = "Auto-unlocks at 2,500 lifetime score.",
            PriceScore = 0, MilestoneScore = 2500,
            PreviewIcon = "directions_run"
        },
        new CosmeticItem
        {
            Id = "title-curator", Kind = CosmeticKind.RankTitle,
            DisplayName = "Curator", Description = "Auto-unlocks at 5,000 lifetime score.",
            PriceScore = 0, MilestoneScore = 5000,
            PreviewIcon = "museum"
        },
        new CosmeticItem
        {
            Id = "title-night-owl", Kind = CosmeticKind.RankTitle,
            DisplayName = "Night Owl", Description = "Shop-only. For the 3am crowd.",
            PriceScore = 500,
            PreviewIcon = "nights_stay"
        },
        new CosmeticItem
        {
            Id = "title-archivist", Kind = CosmeticKind.RankTitle,
            DisplayName = "Archivist", Description = "Shop-only. For the catalog completionist.",
            PriceScore = 800,
            PreviewIcon = "inventory_2"
        },
        new CosmeticItem
        {
            Id = "title-tastemaker", Kind = CosmeticKind.RankTitle,
            DisplayName = "Tastemaker", Description = "Shop-only. For the broad-genre eclectic.",
            PriceScore = 1200,
            PreviewIcon = "auto_awesome"
        },
        new CosmeticItem
        {
            Id = "title-binge-king", Kind = CosmeticKind.RankTitle,
            DisplayName = "Binge King", Description = "Shop-only. For the marathon completionist.",
            PriceScore = 700,
            PreviewIcon = "weekend"
        },
        new CosmeticItem
        {
            Id = "title-completionist", Kind = CosmeticKind.RankTitle,
            DisplayName = "Completionist", Description = "Auto-unlocks at 10,000 lifetime score. The peak.",
            PriceScore = 0, MilestoneScore = 10000,
            PreviewIcon = "verified"
        },
        new CosmeticItem
        {
            Id = "title-aficionado", Kind = CosmeticKind.RankTitle,
            DisplayName = "Aficionado", Description = "Shop-only. For the connoisseur of the obscure.",
            PriceScore = 950,
            PreviewIcon = "psychology"
        },
        new CosmeticItem
        {
            Id = "title-legend", Kind = CosmeticKind.RankTitle,
            DisplayName = "Legend", Description = "Auto-unlocks at 7,500 lifetime score.",
            PriceScore = 0, MilestoneScore = 7500,
            PreviewIcon = "workspace_premium"
        },

        // ---- Avatars (8) ----
        // Free default + 7 shop-only emoji avatars that swap the rank-icon
        // medal next to your title. PreviewColor stores the emoji string the
        // client substitutes into #abSaRankIcon.
        new CosmeticItem
        {
            Id = "avatar-medal", Kind = CosmeticKind.Avatar,
            DisplayName = "Medal", Description = "The classic gold medal.",
            PriceScore = 0, MilestoneScore = 0,
            PreviewColor = "🏅", PreviewIcon = "military_tech"
        },
        new CosmeticItem
        {
            Id = "avatar-trophy", Kind = CosmeticKind.Avatar,
            DisplayName = "Trophy", Description = "For the gold standard.",
            PriceScore = 250,
            PreviewColor = "🏆", PreviewIcon = "emoji_events"
        },
        new CosmeticItem
        {
            Id = "avatar-crown", Kind = CosmeticKind.Avatar,
            DisplayName = "Crown", Description = "Royal flair.",
            PriceScore = 350,
            PreviewColor = "👑", PreviewIcon = "auto_awesome"
        },
        new CosmeticItem
        {
            Id = "avatar-clapper", Kind = CosmeticKind.Avatar,
            DisplayName = "Clapperboard", Description = "Action!",
            PriceScore = 200,
            PreviewColor = "🎬", PreviewIcon = "local_movies"
        },
        new CosmeticItem
        {
            Id = "avatar-flame", Kind = CosmeticKind.Avatar,
            DisplayName = "Flame", Description = "On fire.",
            PriceScore = 200,
            PreviewColor = "🔥", PreviewIcon = "local_fire_department"
        },
        new CosmeticItem
        {
            Id = "avatar-owl", Kind = CosmeticKind.Avatar,
            DisplayName = "Night Owl", Description = "Late-night viewer's mark.",
            PriceScore = 250,
            PreviewColor = "🦉", PreviewIcon = "nights_stay"
        },
        new CosmeticItem
        {
            Id = "avatar-diamond", Kind = CosmeticKind.Avatar,
            DisplayName = "Diamond", Description = "Premium aesthetic.",
            PriceScore = 400,
            PreviewColor = "💎", PreviewIcon = "diamond"
        },
        new CosmeticItem
        {
            Id = "avatar-rocket", Kind = CosmeticKind.Avatar,
            DisplayName = "Rocket", Description = "Sci-fi binge mode.",
            PriceScore = 300,
            PreviewColor = "🚀", PreviewIcon = "rocket_launch"
        },
        // ---- Avatars: more (6) ----
        new CosmeticItem
        {
            Id = "avatar-popcorn", Kind = CosmeticKind.Avatar,
            DisplayName = "Popcorn", Description = "Movie night essential.",
            PriceScore = 200,
            PreviewColor = "🍿", PreviewIcon = "local_movies"
        },
        new CosmeticItem
        {
            Id = "avatar-ghost", Kind = CosmeticKind.Avatar,
            DisplayName = "Ghost", Description = "For the horror binger.",
            PriceScore = 300,
            PreviewColor = "👻", PreviewIcon = "blur_on"
        },
        new CosmeticItem
        {
            Id = "avatar-unicorn", Kind = CosmeticKind.Avatar,
            DisplayName = "Unicorn", Description = "Rare and magical.",
            PriceScore = 500,
            PreviewColor = "🦄", PreviewIcon = "auto_awesome"
        },
        new CosmeticItem
        {
            Id = "avatar-dragon", Kind = CosmeticKind.Avatar,
            DisplayName = "Dragon", Description = "Mythic-tier avatar.",
            PriceScore = 600,
            PreviewColor = "🐉", PreviewIcon = "local_fire_department"
        },
        new CosmeticItem
        {
            Id = "avatar-star", Kind = CosmeticKind.Avatar,
            DisplayName = "Star", Description = "Shine bright.",
            PriceScore = 200,
            PreviewColor = "⭐", PreviewIcon = "star"
        },
        new CosmeticItem
        {
            Id = "avatar-controller", Kind = CosmeticKind.Avatar,
            DisplayName = "Controller", Description = "Game on.",
            PriceScore = 350,
            PreviewColor = "🎮", PreviewIcon = "videogame_asset"
        },

        // ---- Profile themes: more (5) ----
        new CosmeticItem
        {
            Id = "theme-galaxy", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Galaxy", Description = "Deep-space purple with starlight specks.",
            PriceScore = 600,
            PreviewColor = "#581c87", PreviewIcon = "stars"
        },
        new CosmeticItem
        {
            Id = "theme-forest", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Forest", Description = "Pine green with golden-hour highlights.",
            PriceScore = 350,
            PreviewColor = "#15803d", PreviewIcon = "park"
        },
        new CosmeticItem
        {
            Id = "theme-ocean", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Ocean", Description = "Deep blue with bioluminescent accents.",
            PriceScore = 400,
            PreviewColor = "#0c4a6e", PreviewIcon = "waves"
        },
        new CosmeticItem
        {
            Id = "theme-rosegold", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Rose Gold", Description = "Soft pink + warm gold accents.",
            PriceScore = 450,
            PreviewColor = "#fb7185", PreviewIcon = "spa"
        },
        new CosmeticItem
        {
            Id = "theme-midnight", Kind = CosmeticKind.ProfileTheme,
            DisplayName = "Midnight", Description = "Pure deep navy with subtle indigo glow.",
            PriceScore = 300,
            PreviewColor = "#1e1b4b", PreviewIcon = "nightlight"
        },

        // ---- Animated Backgrounds (7) ----
        new CosmeticItem
        {
            Id = "bg-none", Kind = CosmeticKind.Background,
            DisplayName = "None", Description = "Clean look, no animated layer.",
            PriceScore = 0, MilestoneScore = 0,
            PreviewIcon = "block"
        },
        new CosmeticItem
        {
            Id = "bg-blackhole", Kind = CosmeticKind.Background,
            DisplayName = "Black Hole", Description = "Rotating accretion disk warps the page background.",
            PriceScore = 800,
            PreviewIcon = "blur_circular"
        },
        new CosmeticItem
        {
            Id = "bg-starfield", Kind = CosmeticKind.Background,
            DisplayName = "Starfield", Description = "Twinkling stars drift across the deep.",
            PriceScore = 500,
            PreviewIcon = "stars"
        },
        new CosmeticItem
        {
            Id = "bg-nebula", Kind = CosmeticKind.Background,
            DisplayName = "Nebula", Description = "Slow-drifting magenta + cyan cloud cover.",
            PriceScore = 600,
            PreviewIcon = "cloud"
        },
        new CosmeticItem
        {
            Id = "bg-matrix", Kind = CosmeticKind.Background,
            DisplayName = "Matrix", Description = "Real falling green code rain. Live video loop.",
            PriceScore = 700,
            PreviewIcon = "code"
        },
        new CosmeticItem
        {
            Id = "bg-aurora", Kind = CosmeticKind.Background,
            DisplayName = "Aurora", Description = "Milky-way + aurora over a mountain. Live video loop.",
            PriceScore = 650,
            PreviewIcon = "auto_awesome"
        },
        new CosmeticItem
        {
            Id = "bg-fireflies", Kind = CosmeticKind.Background,
            DisplayName = "Fireflies", Description = "Minecraft-style firefly forest. Live video loop.",
            PriceScore = 550,
            PreviewIcon = "emoji_nature"
        },
        new CosmeticItem
        {
            Id = "bg-galaxy", Kind = CosmeticKind.Background,
            DisplayName = "Galaxy", Description = "Slow-drifting galaxy spiral. Live video loop.",
            PriceScore = 600,
            PreviewIcon = "blur_circular"
        },
        new CosmeticItem
        {
            Id = "bg-moonlit-village", Kind = CosmeticKind.Background,
            DisplayName = "Moonlit Village", Description = "Cozy snow-dusted hamlet under moonlight. Live video loop.",
            PriceScore = 700,
            PreviewIcon = "cabin"
        },
        new CosmeticItem
        {
            Id = "bg-rainy-station", Kind = CosmeticKind.Background,
            DisplayName = "Rainy Station", Description = "Train platform in slow rain. Live video loop.",
            PriceScore = 650,
            PreviewIcon = "umbrella"
        },

        // ---- Profile Borders (6) ----
        new CosmeticItem
        {
            Id = "border-none", Kind = CosmeticKind.ProfileBorder,
            DisplayName = "None", Description = "No extra border on the profile card.",
            PriceScore = 0, MilestoneScore = 0,
            PreviewIcon = "crop_square"
        },
        new CosmeticItem
        {
            Id = "border-gold-shimmer", Kind = CosmeticKind.ProfileBorder,
            DisplayName = "Gold Shimmer", Description = "Animated gold gradient sweeps across the edge.",
            PriceScore = 450,
            PreviewColor = "#facc15", PreviewIcon = "auto_awesome"
        },
        new CosmeticItem
        {
            Id = "border-plasma", Kind = CosmeticKind.ProfileBorder,
            DisplayName = "Plasma", Description = "Color-cycling neon glow.",
            PriceScore = 550,
            PreviewColor = "#ec4899", PreviewIcon = "bolt"
        },
        new CosmeticItem
        {
            Id = "border-ember", Kind = CosmeticKind.ProfileBorder,
            DisplayName = "Ember", Description = "Pulsing red ember halo.",
            PriceScore = 400,
            PreviewColor = "#dc2626", PreviewIcon = "local_fire_department"
        },
        new CosmeticItem
        {
            Id = "border-holo", Kind = CosmeticKind.ProfileBorder,
            DisplayName = "Holo Edge", Description = "Iridescent rainbow that drifts.",
            PriceScore = 600,
            PreviewColor = "#22d3ee", PreviewIcon = "blur_on"
        },
        new CosmeticItem
        {
            Id = "border-crystal", Kind = CosmeticKind.ProfileBorder,
            DisplayName = "Crystal", Description = "Cool blue refractive edge.",
            PriceScore = 350,
            PreviewColor = "#bfdbfe", PreviewIcon = "ac_unit"
        }
    };

    public ShopCatalog GetCatalog()
    {
        return new ShopCatalog
        {
            PowerUps = _powerUpItems.Select(p => new ShopPowerUpItem
            {
                Type = p.Type, Id = p.Id, DisplayName = p.DisplayName,
                Description = p.Description, PriceScore = p.PriceScore,
                BundleSize = p.BundleSize
            }).ToList(),
            Cosmetics = _cosmeticItems.Select(c => new CosmeticItem
            {
                Id = c.Id, Kind = c.Kind, DisplayName = c.DisplayName,
                Description = c.Description, PriceScore = c.PriceScore,
                MilestoneScore = c.MilestoneScore,
                PreviewColor = c.PreviewColor, PreviewIcon = c.PreviewIcon
            }).ToList()
        };
    }

    /// <summary>
    /// Run the score-milestone check whenever a user gains score. Any
    /// cosmetics whose MilestoneScore the user has now crossed get added
    /// to OwnedCosmetics. Idempotent (already-owned cosmetics are skipped).
    /// <para>
    /// Returns what was granted on this call, so the caller can tell the user
    /// about it. Premium titles are gated behind months of play, and until
    /// v2.2 they arrived with no toast, webhook or feed entry: the only trace
    /// was the log line below, which no user reads.
    /// </para>
    /// </summary>
    public List<CosmeticItem> CheckMilestones(UserAchievementProfile profile, int currentScore)
    {
        var granted = new List<CosmeticItem>();
        if (profile is null) return granted;
        EnsureDefaultsOwned(profile);
        foreach (var c in _cosmeticItems)
        {
            if (c.MilestoneScore is null or 0) continue;
            if (currentScore < c.MilestoneScore.Value) continue;
            if (!profile.OwnedCosmetics.Contains(c.Id))
            {
                profile.OwnedCosmetics.Add(c.Id);
                granted.Add(c);
                _logger.LogInformation(
                    "[AchievementBadges] Auto-unlocked milestone cosmetic {Id} for user {UserId} at score {Score}.",
                    c.Id, profile.UserId, currentScore);
            }
        }

        return granted;
    }

    /// <summary>
    /// Auto-grant the free Default theme + Default frame on first sight. They
    /// have PriceScore=0 so the storefront otherwise renders a degenerate
    /// "0 score / BUY" row that confuses users. Idempotent.
    /// </summary>
    public void EnsureDefaultsOwned(UserAchievementProfile profile)
    {
        if (profile is null) return;
        foreach (var c in _cosmeticItems)
        {
            if (c.PriceScore != 0) continue;
            if (c.MilestoneScore is > 0) continue; // milestone-locked freebies stay locked
            if (!profile.OwnedCosmetics.Contains(c.Id))
            {
                profile.OwnedCosmetics.Add(c.Id);
            }
        }
    }

    /// <summary>
    /// Purchase an item. Validates user can afford it, deducts score,
    /// grants the inventory bump (for power-ups) or marks ownership (for
    /// cosmetics). Returns a result object the controller hands back.
    /// </summary>
    public ShopPurchaseResult TryPurchase(UserAchievementProfile profile, string itemId)
    {
        if (profile is null) return Fail("Profile not found.");
        if (string.IsNullOrWhiteSpace(itemId)) return Fail("Item id is required.");

        // Power-up first
        var pu = _powerUpItems.FirstOrDefault(p => p.Id.Equals(itemId, StringComparison.OrdinalIgnoreCase));
        if (pu is not null)
        {
            if (profile.ScoreBank < pu.PriceScore)
            {
                return Fail($"Not enough score. You have {profile.ScoreBank}, item costs {pu.PriceScore}.");
            }
            // Capacity check first: don't take score if the inventory is
            // already at the cap (so the user doesn't lose 50 score for
            // nothing).
            var key = pu.Type.ToString();
            profile.PowerUpInventory.TryGetValue(key, out var have);
            var cap = pu.Type == PowerUpType.StreakFreeze
                ? PowerUpDefinitions.MaxStreakFreezesBanked
                : PowerUpDefinitions.MaxInventoryPerType;
            if (have + pu.BundleSize > cap)
            {
                return Fail($"Inventory would exceed cap ({cap}). You have {have}; bundle adds {pu.BundleSize}.");
            }

            profile.ScoreBank -= pu.PriceScore;
            profile.LifetimeScoreSpent += pu.PriceScore;
            _powerUps.Grant(profile, pu.Type, pu.BundleSize);

            return new ShopPurchaseResult
            {
                Success = true,
                Message = $"Purchased {pu.DisplayName}.",
                ScoreBalanceAfter = profile.ScoreBank,
                PowerUpInventoryAfter = profile.PowerUpInventory.TryGetValue(key, out var newHave) ? newHave : 0
            };
        }

        // Cosmetic next
        var cos = _cosmeticItems.FirstOrDefault(c => c.Id.Equals(itemId, StringComparison.OrdinalIgnoreCase));
        if (cos is not null)
        {
            if (profile.OwnedCosmetics.Contains(cos.Id))
            {
                return Fail("You already own that cosmetic.");
            }
            // Default cosmetics (PriceScore=0, MilestoneScore=0) are
            // implicitly available to everyone; no purchase needed.
            if (cos.PriceScore == 0 && cos.MilestoneScore is 0)
            {
                profile.OwnedCosmetics.Add(cos.Id);
                return new ShopPurchaseResult
                {
                    Success = true,
                    Message = $"{cos.DisplayName} unlocked.",
                    ScoreBalanceAfter = profile.ScoreBank,
                    OwnedCosmeticId = cos.Id
                };
            }
            // Milestone-only cosmetics (MilestoneScore > 0, PriceScore = 0)
            // can't be bought - must be earned. Surface a useful error.
            if (cos.PriceScore == 0 && cos.MilestoneScore is > 0)
            {
                return Fail($"That cosmetic auto-unlocks at {cos.MilestoneScore} lifetime score. Keep watching.");
            }
            if (profile.ScoreBank < cos.PriceScore)
            {
                return Fail($"Not enough score. You have {profile.ScoreBank}, item costs {cos.PriceScore}.");
            }

            profile.ScoreBank -= cos.PriceScore;
            profile.LifetimeScoreSpent += cos.PriceScore;
            profile.OwnedCosmetics.Add(cos.Id);

            return new ShopPurchaseResult
            {
                Success = true,
                Message = $"Purchased {cos.DisplayName}.",
                ScoreBalanceAfter = profile.ScoreBank,
                OwnedCosmeticId = cos.Id
            };
        }

        return Fail("Item not found in catalog.");
    }

    /// <summary>
    /// Equip an owned cosmetic to its slot. Validates ownership.
    /// </summary>
    public (bool ok, string message) Equip(UserAchievementProfile profile, string? cosmeticId)
    {
        if (profile is null) return (false, "Profile not found.");
        if (string.IsNullOrWhiteSpace(cosmeticId))
        {
            return (false, "Specify a cosmetic id to equip, or use the unequip endpoint to clear a slot.");
        }
        var cos = _cosmeticItems.FirstOrDefault(c => c.Id.Equals(cosmeticId, StringComparison.OrdinalIgnoreCase));
        if (cos is null) return (false, "Cosmetic not found.");
        if (!profile.OwnedCosmetics.Contains(cos.Id))
        {
            return (false, "You don't own that cosmetic.");
        }
        switch (cos.Kind)
        {
            case CosmeticKind.ProfileTheme:    profile.EquippedThemeId         = cos.Id; break;
            case CosmeticKind.BadgeFrame:      profile.EquippedBadgeFrameId    = cos.Id; break;
            case CosmeticKind.RankTitle:       profile.EquippedCustomTitleId   = cos.Id; break;
            case CosmeticKind.Avatar:          profile.EquippedAvatarId        = cos.Id; break;
            case CosmeticKind.Background:      profile.EquippedBackgroundId    = cos.Id; break;
            case CosmeticKind.ProfileBorder:   profile.EquippedProfileBorderId = cos.Id; break;
        }
        return (true, $"{cos.DisplayName} equipped.");
    }

    public (bool ok, string message) Unequip(UserAchievementProfile profile, CosmeticKind kind)
    {
        if (profile is null) return (false, "Profile not found.");
        switch (kind)
        {
            case CosmeticKind.ProfileTheme:    profile.EquippedThemeId         = null; break;
            case CosmeticKind.BadgeFrame:      profile.EquippedBadgeFrameId    = null; break;
            case CosmeticKind.RankTitle:       profile.EquippedCustomTitleId   = null; break;
            case CosmeticKind.Avatar:          profile.EquippedAvatarId        = null; break;
            case CosmeticKind.Background:      profile.EquippedBackgroundId    = null; break;
            case CosmeticKind.ProfileBorder:   profile.EquippedProfileBorderId = null; break;
        }
        return (true, "Slot cleared.");
    }

    private static ShopPurchaseResult Fail(string message) =>
        new() { Success = false, Message = message };
}
