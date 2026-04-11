<p align="center">
  <img width="1070" alt="achievement-banner" src="https://raw.githubusercontent.com/ZL154/AchievementBadges_for_Jellyfin/main/assets/banner.svg" />
</p>

```text
 █████╗  ██████╗██╗  ██╗██╗███████╗██╗   ██╗███████╗███╗   ███╗███████╗███╗   ██╗████████╗
██╔══██╗██╔════╝██║  ██║██║██╔════╝██║   ██║██╔════╝████╗ ████║██╔════╝████╗  ██║╚══██╔══╝
███████║██║     ███████║██║█████╗  ██║   ██║█████╗  ██╔████╔██║█████╗  ██╔██╗ ██║   ██║
██╔══██║██║     ██╔══██║██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║
██║  ██║╚██████╗██║  ██║██║███████╗ ╚████╔╝ ███████╗██║ ╚═╝ ██║███████╗██║ ╚████║   ██║
╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚══════╝  ╚═══╝  ╚══════╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝
```

<p align="center">
  <img src="https://img.shields.io/badge/Jellyfin-10.11%2B-0b0b0b?style=for-the-badge&labelColor=000000&color=2b2b2b" />
  <img src="https://img.shields.io/badge/Type-Plugin-E50914?style=for-the-badge&labelColor=000000&color=E50914" />
  <img src="https://img.shields.io/badge/System-Achievements-darkred?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Version-1.5.9-darkred?style=for-the-badge" />
</p>

# 🏆 Achievement Badges for Jellyfin

A full progression, gamification and achievement system for Jellyfin that rewards users based on real viewing activity.

---

## ✨ Overview

Over **100 built-in achievements** across dozens of categories, a 10-tier rank ladder from Rookie to Immortal, a score economy with combos, prestige, and daily/weekly quests, plus admin power features like custom badges, seasonal challenges, webhook notifications and a full audit log.

Designed to integrate cleanly with modern Jellyfin setups and themes like NetFin, ElegantFin, or StarTrack.

---

## 🧩 Core features

### 🏅 Badge system
- **100+ built-in achievements** across Films, Series, Binge, Night Watching, Morning, Weekend, Exploration, Streaks, Episode/Film Marathons, Eras, World, Languages, Genres, Runtime, Total Time, Holidays (Christmas, New Year, Halloween, Eid), Library Completion, Loyalty, People, Rewatch, and Hidden categories
- **6 rarity tiers** — Common, Uncommon, Rare, Epic, Legendary, Mythic
- **Hidden/secret badges** displayed as `???` until unlocked
- **Library completion milestones** that auto-scale to any library structure
- **Per-person tracking** — Director and Actor affinity badges
- **Per-genre tracking** — unique genre counters with dedicated badges
- **Era / country / language** breakdowns via item metadata
- **Watch streaks** — current and best streak badges
- **Daily login streak** — loyalty rewards for consistent visits

### 🎖️ Rank system
- **10 tiers** from Rookie → Novice → Viewer → Regular → Enthusiast → Binger → Connoisseur → Maestro → Legend → Immortal
- Rank computed from your achievement score with progress bar to next tier
- **Theme unlocks** — the achievements page changes gradient/border color as you climb
- Home widget shows your current rank, score, and next tier target

### 💰 Score economy
- Every playback accrues 5 base points into a **score bank**
- **Combo multiplier** — consecutive watches within 15 minutes stack up to +100% bonus
- **Spend bank** to buy locked badges directly
- **Gift score** to other users on your server
- Rarity-based badge scoring (10-150 pts), scaled by prestige level

### ⭐ Prestige
- Reach Legend rank (12,000 score) to unlock prestige
- **Resets badges + counters** but keeps your lifetime score and awards a prestige star
- Each prestige level adds a **+50% score multiplier** to future badge unlocks
- Visible on profile and leaderboard

### 🎯 Daily & weekly quests
- **3 concurrent daily quests** rotating from 12 templates
- **3 concurrent weekly quests** rotating from 8 templates
- Deterministic rotation — everyone on the server gets the same quests per day/week
- Completing quests pays into the score bank

### 📊 Stats & visualization
- **Recap tab** — weekly / monthly / yearly breakdowns with top genres, directors, actors
- **Watch heatmap** — GitHub-style calendar (30/90/180/365 day range) colored by intensity
- **Genre radar chart** — SVG spider chart of your genre distribution
- **Stats snapshot** — histogram of unlocked / score / best streak
- **Category leaderboards** — Score, Movies, Episodes, Hours, Best Streak, Series

### 🏠 UI integration
- **Sidebar entry** auto-injected into the Jellyfin nav menu
- **Home screen widget** showing rank and 3 closest-to-unlock badges
- **Equipped badge showcase** in header + profile
- **Unlock toast notifications** that pop up during playback (polled every 30s)
- **Standalone achievements page** at `#!/achievements`
- **Shareable profile card** — server-rendered HTML at `/Plugins/AchievementBadges/users/{id}/profile-card`

### 🛠️ Admin features
- **Enable/disable individual badges** — useful if your server can't satisfy some criteria (e.g. not enough libraries)
- **Visual badge editor** — form-based creator for custom badges
- **JSON editor** alternative for power users
- **Seasonal challenges** — time-limited goals with start/end dates
- **Challenge templates** — one-click add for Monthly Marathon, October Horror, New Year, Summer Blockbuster
- **Webhook notifications** — Discord/Slack-compatible POST on every unlock, auto-detects format
- **Audit log** — last 5,000 unlock events with timestamps and user details
- **Progress injection** — set arbitrary counter values for testing / gifting
- **Export / import** profile JSON for server migration
- **Per-badge reset** — wipe a single badge without nuking the whole profile
- **UI feature toggles** — disable toasts, home widget, item ribbon individually
- **Admin auth lockdown** — all admin endpoints require elevated permissions

### 🔒 Tracking
- **Watch history backfill** — scans existing Jellyfin play history to retroactively award badges on install
- **Auto-evaluation on startup** — new badges from plugin updates auto-unlock if your existing counters already satisfy them, no manual scan needed
- **Live playback tracker** — unlocks fire during viewing, past the 80% completion threshold
- **Rewatch detection** — dedupes within 6 hours, counts rewatches beyond that
- **People metadata extraction** — uses `ILibraryManager.GetPeople()` for directors/actors

---

## ⚙️ Installation

1. Go to **Dashboard → Plugins → Repositories**
2. Add:

```
https://raw.githubusercontent.com/ZL154/AchievementBadges_for_Jellyfin/main/manifest.json
```

3. Save and refresh plugins
4. Install **Achievement Badges**
5. Restart Jellyfin
6. Go to **Dashboard → Plugins → Achievement Badges → Settings**
7. Click **Scan watch history** (or **Scan all users**) to backfill from your existing play data
8. Explore `#!/achievements` to see your profile

---

## 🔧 Requirements

- **Jellyfin 10.11+**
- **File Transformation plugin** (strongly recommended) — ensures sidebar, dashboard UI, profile showcase and achievements page inject reliably across Jellyfin Web updates. Without it most UI injection still works via the plugin's own middleware, but File Transformation gives the most robust integration.

### Optional but helpful

- **Proper metadata provider** (TMDb, OMDb) — required for Director/Actor badges to populate. Badges based on `item.People` will stay empty if your library doesn't have people scraped
- **Home Screen Sections plugin** — lets the achievement home widget inject more reliably

### What each feature needs

| Feature | Depends on |
|---|---|
| Sidebar + header injection | Nothing (works standalone) |
| Watch history backfill | Played flag on items (Jellyfin default) |
| Genre badges | Items with `Genres` metadata |
| Director/Actor badges | Items with `People` metadata (TMDb/OMDb scrape) |
| Era / decade badges | Items with `ProductionYear` metadata |
| Country badges | Items with `ProductionLocations` metadata |
| Language badges | Items with `OriginalLanguage` metadata |
| Runtime badges | Items with `RunTimeTicks` populated |
| Library completion | At least one library folder with items |
| Webhook notifications | A webhook URL (Discord, Slack, or generic) |
| Home widget | `.homeSectionsContainer` in the DOM (standard Jellyfin) |

---

## 📡 API endpoints

### User-facing (require auth)
```
GET    /Plugins/AchievementBadges/users/{userId}                      — full badge list
GET    /Plugins/AchievementBadges/users/{userId}/summary              — unlocked/total/score
GET    /Plugins/AchievementBadges/users/{userId}/rank                 — rank tier + next tier
GET    /Plugins/AchievementBadges/users/{userId}/equipped             — equipped badges
POST   /Plugins/AchievementBadges/users/{userId}/equipped/{badgeId}
DELETE /Plugins/AchievementBadges/users/{userId}/equipped/{badgeId}
GET    /Plugins/AchievementBadges/users/{userId}/recap?period=week|month|year
GET    /Plugins/AchievementBadges/users/{userId}/watch-calendar?days=90
GET    /Plugins/AchievementBadges/users/{userId}/quests               — daily + weekly
GET    /Plugins/AchievementBadges/users/{userId}/daily-quest
GET    /Plugins/AchievementBadges/users/{userId}/weekly-quest
GET    /Plugins/AchievementBadges/users/{userId}/bank                 — score bank + prestige
POST   /Plugins/AchievementBadges/users/{userId}/prestige
POST   /Plugins/AchievementBadges/users/{userId}/buy-badge/{badgeId}
POST   /Plugins/AchievementBadges/users/{userId}/gift/{toUserId}?amount=N
GET    /Plugins/AchievementBadges/users/{userId}/chase/{badgeId}      — items to watch to finish a badge
GET    /Plugins/AchievementBadges/users/{userId}/recommendations      — top 3 closest-to-unlock
GET    /Plugins/AchievementBadges/users/{userId}/profile-card         — HTML profile card
GET    /Plugins/AchievementBadges/users/{userId}/unlocks-since?since=ISO
GET    /Plugins/AchievementBadges/users/{userId}/library-completion
POST   /Plugins/AchievementBadges/users/{userId}/login-ping
GET    /Plugins/AchievementBadges/leaderboard?limit=10
GET    /Plugins/AchievementBadges/leaderboard/{category}?limit=10     — score|movies|episodes|hours|streak|series
GET    /Plugins/AchievementBadges/server/stats
```

### Admin-only (require `RequiresElevation`)
```
POST   /Plugins/AchievementBadges/users/{userId}/backfill
POST   /Plugins/AchievementBadges/backfill-all
POST   /Plugins/AchievementBadges/users/{userId}/reset
POST   /Plugins/AchievementBadges/users/{userId}/reset-badge/{badgeId}
POST   /Plugins/AchievementBadges/users/{userId}/library-completion/recompute
POST   /Plugins/AchievementBadges/users/{userId}/import
GET    /Plugins/AchievementBadges/users/{userId}/export
GET/POST  /Plugins/AchievementBadges/admin/badge-catalog              — enable/disable badges
GET/POST  /Plugins/AchievementBadges/admin/custom-badges              — custom badge definitions
GET/POST  /Plugins/AchievementBadges/admin/challenges                 — seasonal challenges
GET       /Plugins/AchievementBadges/admin/challenge-templates        — one-click templates
GET/POST  /Plugins/AchievementBadges/admin/webhook                    — webhook config
GET/POST  /Plugins/AchievementBadges/admin/ui-features                — UI feature toggles
GET       /Plugins/AchievementBadges/admin/audit-log?limit=200
POST      /Plugins/AchievementBadges/admin/users/{userId}/inject-counters
```

---

## 🖼 Showcase

_Screenshots coming with v1.5.x once UI is stable_

---
See the [Releases page](https://github.com/ZL154/AchievementBadges_for_Jellyfin/releases) for full notes.

---

⭐ If you use this plugin, consider starring the repository.
