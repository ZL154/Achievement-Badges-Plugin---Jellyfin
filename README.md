<p align="center">
  <img alt="achievement-banner" src="https://raw.githubusercontent.com/ZL154/AchievementBadges_for_Jellyfin/main/assets/achievement.png" />
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
  <img src="https://img.shields.io/badge/System-Achievements-0b0b0b?style=for-the-badge&labelColor=000000&color=2b2b2b" />
  <img src="https://img.shields.io/badge/Version-1.5.18-0b0b0b?style=for-the-badge&labelColor=000000&color=2b2b2b" />
  <img src="https://img.shields.io/badge/License-MIT-0b0b0b?style=for-the-badge&labelColor=000000&color=2b2b2b" />
</p>

# 🏆 Achievement Badges for Jellyfin

A full progression, gamification and achievement system for Jellyfin that rewards users based on real viewing activity. Think Xbox Gamerscore meets Letterboxd, built natively into your media server.

> **Status:** Feature-complete as of v1.5.11 — the 1.5.12–1.5.18 releases have focused on polish (Xbox-style toasts, gradient tones, banner refinement). Bug fixes and Jellyfin version compatibility will continue; new features will be considered via [pull request](https://github.com/ZL154/AchievementBadges_for_Jellyfin/pulls) or by Issues.

---

## ✨ Overview

Over **170 built-in achievements** across 30+ categories, a 10-tier rank ladder from Rookie to Immortal, a score economy with combos, prestige, and daily/weekly quests, plus admin power features like custom badges, seasonal challenges, webhook notifications and a full audit log.

Designed to integrate cleanly with modern Jellyfin setups and themes like NetFin, ElegantFin, or StarTrack.

---

## 🧩 Core features

### 🏅 Badge system
- **170+ built-in achievements** across Films, Series, Binge, Night Watching, Morning, Weekend, Exploration, Streaks, Episode/Film Marathons, Eras, World, Languages, Genres, Runtime, Total Time, Holidays (Christmas, New Year, Halloween, Eid), Library Completion, Loyalty, People, Rewatch, and Hidden categories
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
- Sidebar badge showcase + header dots display your current equipped badges at a glance

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
- **Equipped badge showcase** in header + profile
- **Xbox-style unlock toasts** that pop up during playback (polled every 30s), with per-rarity glow, shimmer sweep and confetti on rare+ unlocks
- **Admin toast preview** — test buttons in the admin panel fire a sample toast for each rarity tier
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

See the [Releases page](https://github.com/ZL154/AchievementBadges_for_Jellyfin/releases) for full notes.

---

## 📸 Screenshots

### The standalone Achievements page
The full profile view, shown in the Jellyfin sidebar. Rank progress bar, day streak, score, completion percentage, and the tab bar for the seven sub-views (My Badges, Quests, Recap, Leaderboard, Compare, Activity, Wrapped, Stats).

<p align="center">
  <img alt="Achievements page" src="assets/screenshots/achievements-page.png" />
</p>

### Badge grid
171 badges across 30+ categories, each with live progress bars and an Equip button. Unlocked badges show in color with a green status tag; locked badges dim. Rarity-colored borders let you scan the grid visually.

<p align="center">
  <img alt="Badge grid overview" src="assets/screenshots/badges-overview.png" />
</p>

### Rarity tiers in action
Genre specialist badges and streak extremes across all six rarity colors — Common, Uncommon, Rare, Epic, Legendary, Mythic.

<p align="center">
  <img alt="Genre + rarity badges" src="assets/screenshots/genre-badges.png" />
</p>

### Daily and weekly quests
Rotating quests from a template pool. Everyone on the server gets the same daily + weekly challenges so people can race each other. Completing them pays into the score bank.

<p align="center">
  <img alt="Daily and weekly quests" src="assets/screenshots/quests.png" />
</p>

### Recap
Weekly, monthly and yearly breakdowns of what you've actually watched — total items, active days, top genres, top directors, and top actors.
<p align="center">
  <img alt="Recap view" src="assets/screenshots/recap.png" />
</p>

### Compare profiles
Head-to-head profile comparison between any two users on your server. Gradient bars show the relative values on 12 core metrics, and the bottom pills break down how many badges each user has that the other doesn't. (Usernames blurred as User 1 / User 2.)

<p align="center">
  <img alt="Compare profiles view" src="assets/screenshots/compare-profiles.png" />
</p>

### Streak calendar
GitHub-style year calendar of your watch activity. Current streak, best ever, and total active days at a glance.

<p align="center">
  <img alt="Streak calendar" src="assets/screenshots/streak-calendar.png" />
</p>

### Watch heatmap
90-day heatmap grid, colored by daily watch volume. Click the range button to switch between 30/90/180/365 days.

<p align="center">
  <img alt="Watch heatmap" src="assets/screenshots/watch-heatmap.png" />
</p>

### Genre radar + watch clock
SVG spider chart showing your top-5 genre distribution, and a 24-hour polar chart of when you actually watch.

<p align="center">
  <img alt="Genre radar + watch clock" src="assets/screenshots/genre-radar.png" />
</p>

### Admin panel
Every admin section is collapsible so the page stays clean: webhook notifications, toast preview, UI feature toggles, visual badge editor, challenge templates, audit log, progress injection, custom badges, seasonal challenges, and per-badge enable/disable.

<p align="center">
  <img alt="Admin panel" src="assets/screenshots/admin-panel.png" />
</p>

### Advanced options
Scan watch history, reset badges, scan all users, or load a specific user ID — all from one row under the Advanced options toggle.

<p align="center">
  <img alt="Advanced options" src="assets/screenshots/advanced-options.png" />
</p>

### Sidebar entry
Auto-injected into the Jellyfin nav menu — no theme changes required.

<p align="center">
  <img alt="Sidebar entry" src="assets/screenshots/sidebar-entry.png" />
</p>

---

## 📜 License

This project is released under the [MIT License](LICENSE) — one of the most permissive open-source licenses in common use.

**Summary:**

| You can | You must | You cannot |
|---|---|---|
| Use it on any Jellyfin server, personal or commercial | Keep the copyright + license notice in any redistribution | Hold the authors liable if something breaks |
| Fork and modify however you want | | Claim the authors endorse your fork |
| Redistribute modified or unmodified copies | | |
| Bundle it with proprietary software | | |
| Include it in a paid product | | |

If you just want to *run* the plugin, none of this affects you — install it and enjoy.

### Contributions

Pull requests are welcome. By submitting a contribution you agree that your changes will be licensed under the same MIT terms. Keep contributions focused (one feature or fix per PR) and include a short description of what changed and why in the PR body.

### Third-party attributions

- **Jellyfin** (GPL-2.0) — this plugin is a third-party extension for [Jellyfin](https://jellyfin.org/) and is not affiliated with or endorsed by the Jellyfin project. At build time it references `Jellyfin.Controller` and `Jellyfin.Model` NuGet packages, which remain under their own GPL-2.0 license.
- **Xbox-style unlock toast** — the animation style is inspired by [Adam Cosman's Xbox One Achievement codepen](https://codepen.io/AdamCosman/pen/eYpNYgy) and was reimplemented from scratch. No original assets from that codepen ship with this plugin.
- **Material Icons** (Apache 2.0) — icon glyphs referenced in the UI are provided by Jellyfin's own web client and are licensed by Google.

See [LICENSE](LICENSE) for the full license text and third-party notices.

---

⭐ If you use this plugin, consider starring the repository.
