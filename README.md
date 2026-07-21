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
  <a href="https://github.com/ZL154/AchievementBadges_for_Jellyfin/releases/latest"><img src="https://img.shields.io/github/v/release/ZL154/AchievementBadges_for_Jellyfin?style=for-the-badge&labelColor=000000&color=2b2b2b&label=Release" /></a>
  <img src="https://img.shields.io/badge/License-MIT-0b0b0b?style=for-the-badge&labelColor=000000&color=2b2b2b" />
</p>

<p align="center">
  <a href="https://github.com/ZL154/AchievementBadges_for_Jellyfin/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/ZL154/AchievementBadges_for_Jellyfin/ci.yml?style=for-the-badge&labelColor=000000&label=CI" /></a>
  <a href="https://github.com/ZL154/AchievementBadges_for_Jellyfin/actions/workflows/codeql.yml"><img src="https://img.shields.io/github/actions/workflow/status/ZL154/AchievementBadges_for_Jellyfin/codeql.yml?style=for-the-badge&labelColor=000000&label=CodeQL" /></a>
  <a href="https://github.com/ZL154/AchievementBadges_for_Jellyfin/actions/workflows/security.yml"><img src="https://img.shields.io/github/actions/workflow/status/ZL154/AchievementBadges_for_Jellyfin/security.yml?style=for-the-badge&labelColor=000000&label=Security" /></a>
  <a href="https://scorecard.dev/viewer/?uri=github.com/ZL154/AchievementBadges_for_Jellyfin"><img src="https://img.shields.io/ossf-scorecard/github.com/ZL154/AchievementBadges_for_Jellyfin?style=for-the-badge&labelColor=000000&label=OSSF%20Score" alt="OpenSSF Scorecard" /></a>
  <a href="https://www.bestpractices.dev/projects/12937"><img src="https://img.shields.io/cii/level/12937?style=for-the-badge&labelColor=000000&label=Best%20Practices" alt="OpenSSF Best Practices" /></a>
</p>

# 🏆 Achievement Badges for Jellyfin

A full progression, gamification and achievement system for Jellyfin that rewards users based on real viewing activity. Think Xbox Gamerscore meets Letterboxd meets Steam profile customization, built natively into your media server.

> **Status:** Active development — **v2.2.0 (Your Screen, Your Rules)** is live. Achievement navigation is now modular per user, optional Custom Tabs and Plugin Pages hosts reuse the stock page, unlock bursts can be grouped or shown individually, notifications can stay on the device that earned them, and real unlock toasts open the exact achievement. See [What's new in v2.2.0](#-whats-new-in-v220). Built on the v2.1 "Open Library" expansion and v2.0 "Choose Your Loadout" progression game.

---

## 📑 Table of contents

- [Overview](#-overview)
- [What's new in v2.1.0 — Open Library](#-whats-new-in-v210--open-library) — music + books, custom badges, JS Injector fallback, anime/daily-badge fixes, language picker
- [Core features](#-core-features)
  - [Badge system](#-badge-system) — 200+ achievements, 35+ categories, 6 rarities
  - [Rank system](#-rank-system) — 10 tiers from Rookie to Immortal
  - [Score economy](#-score-economy) — earn, combo, gift, **spend** in the shop
  - [Prestige](#-prestige) — Legend-rank reset for +50% multiplier
  - [Daily & weekly quests](#-daily--weekly-quests) — with reroll (v2.0)
  - [Power-ups & Score Shop](#-power-ups--score-shop) **(new in v2.0)**
  - [Profile customization](#-profile-customization) **(new in v2.0)**
  - [Friends drawer](#-friends-drawer) — bi-directional, online/offline, last-watched
  - [Messaging](#-messaging) — 1:1 + groups, attachments, read receipts
  - [Rarity percentage chip](#-rarity-percentage-chip)
  - [Data-loss recovery](#-data-loss-recovery)
  - [Stats & visualization](#-stats--visualization)
  - [UI integration](#-ui-integration) — Classic / Revamp toggle, toasts, sidebar
  - [User preferences](#-user-preferences)
  - [Languages](#-languages)
  - [Admin features](#-admin-features)
  - [Tracking](#-tracking)
- [Security & operations](#-security--operations) — rate limits, CSP, audit log, signed releases, CI
- [Installation](#-installation)
- [Requirements](#-requirements)
- [Troubleshooting](#-troubleshooting)
- [API endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Release history](#-release-history)
- [Support the project](#-support-the-project)
- [Credits & thanks](#-credits--thanks)
- [License](#-license)

---

## ✨ Overview

Over **200 built-in achievements** across 35+ categories, a 10-tier rank ladder from Rookie to Immortal, a full score economy with combos, prestige, daily/weekly quests, a **Score Shop with 70+ cosmetics**, power-up consumables, a Friends drawer with messaging, plus admin power features like custom badges, seasonal challenges, webhook notifications, and a full audit log.

Designed to integrate cleanly with modern Jellyfin setups and themes like NetFin, ElegantFin, or StarTrack.

---

## 🚀 What's new in v2.2.0 — Your Screen, Your Rules

This release makes Achievement Badges fit each user's Jellyfin layout and notification preferences while keeping the stock Achievements page available at all times. **Drop-in upgrade from v2.1.x / v2.0.x — no schema breakage or manual migration.**

- **Optional Custom Tabs and Plugin Pages hosts (#37).** Admins can opt into either integration independently. Both reuse the same Achievements surface instead of maintaining duplicate pages, and compatibility failures stay isolated so they cannot prevent Jellyfin from starting.
- **Per-user navigation controls (#37).** Each user can independently show or hide the Custom Tabs entry, Plugin Pages entry, and header trophy from Achievement settings or Jellyfin's native user settings. Hiding navigation never disables tracking, notifications, or the stock page.
- **Grouped or individual unlock bursts (#38).** Simultaneous unlocks can collapse into one summary with a combined score, or play one at a time using the existing queue.
- **Device-scoped unlock notifications (#38).** Users can keep the default delivery to every signed-in client or restrict a toast to the Jellyfin device that earned it. The server validates the originating device instead of trusting the browser alone.
- **Unlock toasts now lead somewhere useful.** Click a real single unlock (or focus it and press Enter/Space) to open My Badges, clear filters, scroll to the exact badge, and briefly highlight it. Grouped summaries open Recently unlocked. Synthetic admin previews remain deliberately non-navigating and never write achievement data.
- **Better notification testing.** A new **Test 10 unlocks** admin control exercises the saved grouping preference without creating unlocks or modifying a profile.
- **Fresh client assets on every build.** Script cache keys now include the compiled module ID, preventing browsers from retaining an older same-version UI during testing or deployment.
- **Full localization.** Every new option, help message, navigation label, and toast action is translated across all 8 UI languages (English, French, Spanish, German, Italian, Portuguese, Chinese, Japanese).

---

## 🚀 What's new in v2.1.3

A bug-fix patch resolving the outstanding reports from #24 and #36, plus a full builder-localization pass. **Drop-in upgrade from v2.1.x / v2.0.x — no schema breakage; a one-time, ID-preserving custom-badge migration runs automatically.**

- **Genre-filtered music badges now actually filter by genre (#24).** Music plays and listening time are tracked **per genre** (case-insensitive), so a "play 50 disco tracks" badge no longer ticks up when you listen to metal. Three new builder metrics — *Music plays of a genre*, *Music hours of a genre*, *Items watched of a genre* — reveal a genre field when picked.
- **Custom badges fully delete (#24).** The visual builder, the badge list, and delete now share one store (they were previously split, so builder-made badges couldn't be removed), and deleting a badge purges its earned + equipped copies from every user profile. Pre-existing badges are migrated on first startup with their IDs preserved.
- **Header UI survives another header-injecting plugin (#36).** When a second plugin (e.g. Ratings) stripped the badge scripts from `index.html`, the plugin used to think it was still patched and never re-injected. The guard now keys on the actual script tag, so a stripped page is always repaired.
- **Badge category labels fixed (#24).** Categories like *Studio Specialist* and *Books* no longer show as raw `category.*` keys, and every built-in category is now translated.
- **Full builder localization.** The badge-builder metric list, quest builder, power-up + cosmetic pickers, and status messages are now translated across all 8 languages (en/fr/es/de/it/pt/zh/ja).

---

## 🚀 What's new in v2.1.0 — Open Library

Achievements expand beyond film & TV, and admins get real badge-authoring power. **Drop-in upgrade from v2.0.x — no schema breakage, no data migration.**

### 🎵 Music achievements

**18 built-in music badges** driven by real listening — total plays, listening hours, and unique **albums / artists / genres / decades**. Audio items now flow through the same playback-credit pipeline (80% real-listen gate) as films and episodes.

### 📚 Book achievements

**8 book badges** — books completed, audiobook listening hours, and book series completed. An **audiobook-counting policy** lets admins choose whether audiobook plays count toward Books only (default), Music only, or Both.

> **How ebook completion is detected (important):** Jellyfin has no "finished reading an ebook" signal — unlike audiobooks and music, which stream through a session and track listening time automatically, an ebook is text with no runtime. So an **ebook counts once it's marked _Played_** (the ✓ / "Mark as watched" toggle on the item). Simply reaching the last page in Jellyfin's reader does **not** auto-mark it, so book badges won't move until the book is marked played. This is a Jellyfin limitation, not something the plugin can detect on its own.

### 🛠️ Custom badge builder

Define your own badges with **compound AND/OR criteria** across any metric — film, TV, music, books and more. Simple badges via the admin form; compound criteria, icons, and import/export via the API. Full guide + copy-paste templates: [Custom badges](#-custom-badges).

### 🌐 JS Injector fallback (issue #26)

On bare-metal Linux where `/usr/share/jellyfin/web` isn't writable, the on-disk UI injection used to fail silently. The plugin now detects the [JavaScript Injector plugin](https://github.com/n00bcodr/Jellyfin-JavaScript-Injector) and surfaces the exact script URLs to paste in. Details: [Troubleshooting](#-troubleshooting).

### 🇯🇵 Anime detection fix (issue #25)

Anime is now detected from **Genres *and* Tags**, read from both the item **and its parent Series**, with admin-configurable libraries / genres / tags — fixing anime badges that never fired when the classification lived on the Series or in Tags.

### 🗓️ Daily-badge backfill fix + audit tool (issue #27)

Time-windowed badges (daily / weekly / monthly) are now **skipped during the initial history scan**, so they no longer false-unlock from lifetime totals. A new admin **audit + cleanup tool** finds and clears badges wrongly awarded by pre-v2.1.0 backfills (re-earnable organically afterward).

### 🌍 Globe language picker + full admin localization

A **globe dropdown** on the admin page switches the UI language live and persists across reloads, and the **entire admin page** — including the Integrity and testing-tools sections — is now localized across all **8 languages**.

---

## 🧩 Core features

### 🏅 Badge system

- **200+ built-in achievements** across categories: Films, Series, Binge, Night Watching, Morning, Afternoon (12-17h), Prime Time (19-22h), Weekend, Exploration, Streaks, Episode/Film Marathons, Eras, World, Languages, Genres, Runtime, Total Time, Holidays (Christmas, New Year, Halloween, Eid, Valentine's, Easter, Lunar New Year, Diwali, US Thanksgiving, Independence Day, Bonfire Night, Boxing Day, Mother's Day, Father's Day), Library Completion, Loyalty, People, Rewatch, Anime, Studio Specialist, Pilot vs Completer, and Hidden categories
- **8 v2.0 easter-egg badges** — *First Anniversary, Late-Night Sage, Quadruple Feature, Dawn Chorus, Universal Watcher, Archivist Supreme, Deep Cut, Saga Marathon* (don't appear until unlocked)
- **18 music badges (v2.1.0)** — plays, listening hours, and unique albums / artists / genres / decades. Audio plays pass the same 80% real-listen gate as video.
- **8 book badges (v2.1.0)** — books completed, audiobook listening hours, and series completed. Audiobook plays route per the **audiobook-counting policy** (Books-only default / Music-only / Both).
- **Improved anime detection (v2.1.0, #25)** — matches **Genres *and* Tags** on the item *and its parent Series*, with admin-configurable libraries / genres / tags.
- **Admin-authored custom badges (v2.1.0)** — compound AND/OR criteria across any metric; see [Custom badges](#-custom-badges).
- **6 rarity tiers** — Common, Uncommon, Rare, Epic, Legendary, Mythic
- **Hidden/secret badges** displayed as `???` until unlocked
- **Library completion milestones** that auto-scale to any library structure
- **Per-person tracking** — Director and Actor affinity badges
- **Per-genre tracking** — unique genre counters with dedicated badges
- **Era / country / language** breakdowns via item metadata
- **Watch streaks** — current and best streak badges
- **Daily login streak** — loyalty rewards for consistent visits

Standout sub-collections:

- **🎌 Anime tier (5 badges)** — Genre-tag detection (any genre containing `"anime"`, case-insensitive). *Anime Curious / Anime Fan / Otaku / Anime Veteran / All-Otaku* at 5 / 15 / 50 / 200 / 500 anime items.
- **🎬 Studio specialists (6 badges)** — Letterboxd-style "I watch a lot of A24" badges, parameterised by `BaseItem.Studios`:

| Badge | Studio | Threshold |
|---|---|---|
| Spirited Away | Studio Ghibli | 5 |
| A24 Acolyte | A24 | 15 |
| It's Not TV | HBO | 25 |
| Netflix and Watch | Netflix | 50 |
| Auntie Beeb | BBC | 25 |
| House of Mouse | Disney | 50 |

- **🎟️ Pilot vs Completer (6 badges)** — every series whose S1E1 you watch is added to a per-user "pilots watched" set. If any other episode of that series follows, the series graduates into "continued past pilot". *Pilot Tester / Window Shopper / Commitment Issues* for sampling 5 / 20 / 50 series and bailing after the pilot; *Hooked / Sticks the Landing / Always In* for continuing past the pilot on 5 / 20 / 50 series.

> **Backfill credits these too** — the watch-history backfill task passes `Studios`, `SeriesId`, `SeasonNumber`, `EpisodeNumber` through to the achievement service, so historical episodes credit anime / studio / pilot badges. Time-of-day buckets only count NEW sessions.

### 🎖️ Rank system

- **10 tiers** from Rookie → Novice → Viewer → Regular → Enthusiast → Binger → Connoisseur → Maestro → Legend → Immortal
- Rank computed from your achievement score with progress bar to next tier
- **Theme unlocks** — the achievements page changes gradient/border color as you climb
- **Custom rank titles (new in v2.0)** — equip a cosmetic title (Cinephile / Curator / Tastemaker etc.) to replace the auto-generated tier name
- Sidebar badge showcase + header dots display your current equipped badges at a glance

### 💰 Score economy

- Every playback accrues 5 base points into a **score bank**
- **Combo multiplier** — consecutive watches within 15 minutes stack up to +100% bonus
- **Spend bank** to buy locked badges directly, **or in the new Shop on power-ups + cosmetics (v2.0)**
- **Gift score** to other users on your server
- **Daily login bonus (v2.0)** — +10 score on first real watch of each UTC day
- Rarity-based badge scoring (10-150 pts), scaled by prestige level

### ⭐ Prestige

- Reach Legend rank (12,000 score) to unlock prestige
- **Resets badges + counters** but keeps your lifetime score and awards a prestige star
- Each prestige level adds a **+50% score multiplier** to future badge unlocks
- Visible on profile and leaderboard

### 🎯 Daily & weekly quests

- **3 concurrent daily quests** rotating from 12 built-in templates
- **3 concurrent weekly quests** rotating from 8 built-in templates
- Deterministic rotation — everyone on the server gets the same quests per day/week
- Completing quests pays into the score bank
- **Reroll (new in v2.0)** — 1 daily reroll per UTC day, 1 weekly reroll per ISO week. Disabled pill shows you've used it, comes back at the next reset.
- **Admin quest customization** — add / edit / remove daily + weekly quests from the admin page, replace built-in quests by Id, or disable built-ins your server can't satisfy

### ⚡ Power-ups & Score Shop

- **3 consumable power-ups** — XP Boost, Double Credit, Streak Freeze
- **70+ cosmetic items** across 6 kinds — themes, frames, titles, avatars, backgrounds, borders
- **Steam-style storefront** with featured carousel, live previews, milestone progress bars, "NEED N MORE SCORE" affordability indicators
- **Daily login bonus** drops a random power-up on first ≥80% real watch of each UTC day
- All purchases audit-logged; admin testing tools to grant items without watch grinding

### 🎨 Profile customization

- **14 Profile Themes** — repaint the whole achievements page in any of 14 styles
- **7 Badge Frames** — animated edges on your equipped badges
- **10 Custom Rank Titles** — 3 auto-unlock + 7 shop-only
- **14 Avatars** — emoji swap for the rank-medal icon
- **8 Animated Backgrounds** — 4 CSS + 4 HD MP4 video loops, viewport-fixed with dimming overlay
- **6 Profile Borders** — animated effects on the hero card

### 👥 Friends drawer

- **Bi-directional** friendship with a proper **request / accept** flow — nobody follows you silently
- **Global floating button** anchored bottom-left on every Jellyfin page — not just the achievements tab. Auto-hides on `/dashboard` + `/plugins` pages and during media playback; reappears as soon as you leave either state
- **Xbox-guide-style side drawer** with four sub-tabs: Friends / Requests / Find / Messages
- **Jellyfin profile-image avatars** per friend row (initials fall back when no image is set)
- **Online / offline** status pulled live from Jellyfin's `ISessionManager`, with a 15-minute grace window so casual browsing still counts as online (not just active playback)
- **Now playing** display — see the series + episode title each online friend is watching
- **Offline — last watched X** — offline friends now show what they watched most recently (mirrors the online "Watching X" treatment). Backed by `IUserDataManager` with reflection-based `LastPlayedDate` lookup
- Each friend's **equipped badges** shown next to their row (respects their privacy prefs)
- **Type-to-search** user picker in the Find tab (not a giant dropdown of every server user)
- **Red unread badge** on the floating button + Requests tab when someone has sent you a friend request
- **Mutual** indicator on friend rows; **Auto-accept** kicks in if the target has already sent a request to you
- **Privacy toggles** in user settings: *Appear offline to friends* (always shows you as offline), *Hide what I'm watching* (still online, but the series/episode is hidden), and *Hide my last watched when offline*. Enforced server-side in `FriendsService.BuildFriendRow` — can't be bypassed by client tampering
- **Compact request rows** — Accept / Decline / Cancel buttons are icon-only with tooltips, so the Requests tab doesn't visually bloat
- Drawer follows the Classic/Revamp toggle — sets `body[data-ab-style="revamp"]` so the same tokens apply globally

### 💬 Messaging

Xbox-Guide-style chat built into the Friends drawer. No external service, no WebSockets, everything stored on your own server.

- **Messages tab** next to Friends / Requests / Find, with threads newest-first, avatars, last-message preview + timestamp, and a per-conversation unread count
- **1:1 DMs** and **group chats** (2–20 participants, named, rename + leave + members list)
- **Image attachments** — PNG / JPEG / GIF / WebP up to 8 MB, server-side magic-byte verification so nobody can smuggle a `.exe` renamed to `.png`. Click-to-zoom lightbox
- **Read receipts** — single green ✓ for delivered, double green ✓✓ for read. Per-participant `readBy` map so group receipts work too
- **Edit and delete** your own messages via WhatsApp-style dropdown — click anywhere on your own bubble to open the menu, 24-hour edit window
- **Clear conversation** button in the chat gear menu (wipes both sides, confirm dialog)
- **Block user** — bi-directional; existing messages kept, new ones rejected. Stored in `UserAchievementProfile.Preferences.BlockedUsers`
- **Per-peer mute** (localStorage-only, no server round-trip) + **per-user prefs** in the standalone settings panel:
  - Master message-notifications toggle
  - Message sound (subtle Web Audio chime, no audio file)
  - **Mute during playback** — suppresses notifications while Jellyfin's video player is active
- **Notifications**:
  - In-app toast (top-center, 5s auto-dismiss, click to open the thread)
  - Browser Notification API when the tab isn't visible and permission is granted
  - Sound chime on inbound message
- **Unread indicators** — pulsing red dot on the chat button in the friends list + count pill on the Messages tab + combined badge on the floating friends button
- **Anti-flicker rendering** — content-hashed; the chat pane only repaints when something actually changed, preserving scroll position
- **Auto-polling** — 6 s inside an open chat, 8 s on the Messages tab, 20 s drawer-wide when closed; all small, all `[Authorize]`-gated
- **Rate limits** — 20 messages per minute per sender, max 1000 chars per message, 2000-message FIFO cap per conversation
- **Friendship gate** — only mutual friends can DM; group creators can only add their own friends. Admin's `FriendsSimpleMode` treats the whole server as one friend list for messaging too
- **Storage** — single `messages.json` + `attachments.json` + `attachments/<id>.<ext>` on disk under `plugins/configurations/achievementbadges/`. Atomic writes via temp file + `File.Move` so a crash mid-send can't corrupt the store. Messages survive server restarts

### 🏅 Rarity percentage chip

- Every badge card on the achievements page shows a coloured chip with the **% of users on your server** who have unlocked that badge
- **Green ≥ 50%** (common on this server), **amber 10–50%** (uncommon), **red < 10%** (rare / flex-worthy)
- Fed by a `/badges/rarity-stats` endpoint with a 5-minute server-side cache so it doesn't re-scan every profile on every page load
- Scarcity signal lets users see "nobody else on this server has this badge" at a glance

### 💾 Data-loss recovery

- `Load()` walks **primary `badges.json` → `.bak` → `.recovery`** before giving up. A flaky primary file with a clean backup recovers silently
- `.bak` is rotated on every successful save
- `.recovery` captures in-session state when the primary is quarantined, so restart never feels like a fresh reset
- `LastLoadSummary` exposed via the `/test` endpoint so admins can see recovery activity
- Unparseable primary files are quarantined to `badges.json.corrupt-<timestamp>` (not deleted) for manual recovery

### 📊 Stats & visualization

- **Recap tab** — weekly / monthly / yearly breakdowns with top genres, directors, actors
- **Year Wrapped** — Spotify-style end-of-year recap with hero, your numbers, your highlights, your favorites
- **Watch heatmap** — GitHub-style calendar (30/90/180/365 day range) colored by intensity
- **Genre radar chart** — SVG spider chart of your genre distribution
- **Watch clock** — 24-hour polar chart of when you actually watch
- **Stats snapshot** — histogram of unlocked / score / best streak
- **Category leaderboards** — Score, Movies, Episodes, Hours, Best Streak, Series

### 🏠 UI integration

- **Sidebar entry** auto-injected into the Jellyfin nav menu (works on web, iOS, and Android after restart)
- **Equipped badge showcase** in header + profile (configurable slot count, 1-10)
- **Xbox-style unlock toasts** with per-rarity colors (6 tiers), Xbox logo → trophy swap, shimmer sweep, and confetti on rare+ unlocks
- **Achievement sound** — Xbox 360 chime for common/uncommon, rare Xbox One chime for rare/epic/legendary/mythic
- **Diamond spritesheet** for legendary/mythic unlocks (147-frame rotating crystal animation)
- **Configurable unlock bursts** — group simultaneous unlocks into one score/count summary (default), or play each achievement animation separately
- **Per-device toast delivery** — choose all signed-in devices (default) or only the Jellyfin device that earned the achievement
- **Toasts during playback** — unlocks fire within ~1s of earning via playback event hooks + DOM fallback
- **Admin toast preview** — test buttons for each rarity tier
- **Standalone achievements page** at `#!/achievements` with the new **Loadout tab (v2.0)** for managing power-ups, shop, and cosmetics
- **Optional page hosts** — reuse the same page inside Custom Tabs or register it with Plugin Pages; both are admin opt-in and the stock page always remains available
- **Modular per-user navigation** — independently show or hide the Custom Tabs entry, Plugin Pages entry, and header trophy without affecting achievement tracking or each other
- **Shareable profile card** — server-rendered HTML at `/Plugins/AchievementBadges/users/{id}/profile-card`
- **Classic / Revamp toggle** — every screen the plugin renders has a Classic/Revamp toggle (`ab-style-pref` localStorage):
  - **Revamp** — magazine-spread hero with massive Geist 700 rank name, 220px conic completion donut, asymmetric stats grid, chapter-numbered tabs (`01 / MY BADGES`, `02 / QUESTS`…), control-panel filter strip, ambient drift orb, film grain overlay, day-streak pulse, rank-name shimmer, full page entrance cascade
  - **Classic** — the v1.8.10 look you know
  - Friends drawer follows the toggle too. **Admin page** has HUD corner brackets, conic rim sheen on Mythic + Legendary cards, animated KPI count-up, tier-staggered reveal.
- **Revamp admin operator strip** — Use my account / Refresh / Simulate playback buttons + live status banner sit at the top of the personal section in Revamp mode. Long-running ops like Scan all users visibly pulse with status text.

### ⚙️ User preferences

A gear icon on the achievements page opens a full settings panel with auto-save:

- **Toast controls** — enable/disable toasts, sound, confetti, milestone toasts
- **Unlock toast style** — grouped summary or individual animations
- **Toast device scope** — every signed-in client or only the device that triggered the unlock
- **Minimum toast rarity** — filter out common spam (All / Rare+ / Epic+ / Legendary+)
- **Privacy** — hide from leaderboard, compare profiles, activity feed, prestige board
- **Navigation integrations** — independently show/hide the Custom Tabs entry, Plugin Pages entry, and header/profile trophy shortcut
- **Achievement page theme** — Default, Dark, or Light (legacy site-wide theme, separate from v2.0's profile-theme cosmetics)
- **Spoiler mode** — hides locked badge descriptions with "???" so you discover them naturally
- **Equipped badge slots** — choose how many badges show in your showcase (1-10)
- **Auto-equip new unlocks** — newly earned badges automatically fill empty slots
- **Per-user language picker** — overrides the admin's server-wide default
- **Hide my last watched when offline** — friends won't see what you watched most recently when you're offline
- **Mute toasts during playback** + **Mute toast sound during playback** — keep the unlock animation/sound out of the way while actively watching
- **Message notifications + sound + mute-during-playback** — full control over the Friends drawer's chat notifications

### 🌍 Languages

- **8 languages** — English, Français, Español, Deutsch, Italiano, Português, 中文 (简体), 日本語
- **~2,200 UI keys** translated across every tab (achievements profile, stats, heatmap, streak calendar, prestige leaderboard, notification prefs, server stats, compare, leaderboards, recap, quests, admin page, and every v2.0 Loadout surface)
- **All 200+ built-in badges** translated — titles + descriptions per language, with hand-tailored cultural references (the *Spirited Away* badge is *Le Voyage de Chihiro* / *El Viaje de Chihiro* / *Chihiros Reise* / *La Città Incantata* / *A Viagem de Chihiro* / *千与千寻* / *千と千尋*)
- **Badge categories + rarities** also localised ("Binge" → "Marathon", "Legendary" → "Légendaire", etc.)
- **All v2.0 cosmetic names + descriptions** translated — Cinephile / 影迷 / シネフィル / Cinéphile, every theme, every avatar, every background
- **Per-user language picker** in preferences; admin can set a server-wide default
- **Globe language picker (v2.1.0)** — a globe dropdown in the admin-page header switches the UI language live and persists across reloads
- **Fully localized admin page (v2.1.0)** — the Integrity & anti-abuse and v2.0 testing-tools sections (previously English-only) are now translated across all 8 locales, as are the new music + book badges
- Translations loaded client-side + server-side (`BadgeLocalizer`) so both UI chrome and badge titles on the leaderboard / showcase / admin grid / equipped showcase localise together

### 🛠️ Admin features

- **Feature Controls** — kill switches for leaderboard, compare, activity feed, prestige, quests
- **Force Privacy Mode** — override all users to hidden from all social features
- **Max Equipped Badges** — server-wide cap (1-10)
- **Restrict Badge Visibility** — users can only see their own badges
- **Disable Badge Categories** — hide entire categories (e.g. "Late Night" for family servers)
- **Custom Welcome Message** — text shown on the achievements page
- **Reset User Progress** — wipe a specific user's badges via admin endpoint
- **Enable/disable individual badges** — useful if your server can't satisfy some criteria
- **Visual badge editor** — form-based creator for custom badges
- **Custom badge builder (v2.1.0)** — simple badges via an admin form, or **compound AND/OR criteria** + import/export via the `/Plugins/AchievementBadges/custom-badges` API. See [Custom badges](#-custom-badges)
- **Daily-badge audit & cleanup (v2.1.0, #27)** — scans every profile for time-windowed badges wrongly awarded by pre-v2.1.0 backfills and clears them (re-earnable organically); audit-logged
- **JSON editor** alternative for power users
- **Seasonal challenges** — time-limited goals with start/end dates
- **Challenge templates** — one-click add for Monthly Marathon, October Horror, New Year, Summer Blockbuster
- **Webhook notifications** — Discord/Slack-compatible POST on every unlock
  - **HMAC-SHA256 signing** — when admin sets `WebhookSigningSecret`, every outbound POST carries `X-AchievementBadges-Signature: sha256=<hex>` + `X-AchievementBadges-Timestamp: <unix>`. Receivers verify with `HMAC(secret, timestamp + "." + raw_body)` and reject stale timestamps to prevent replay. Same envelope as Stripe and GitHub. Empty secret = legacy unsigned behaviour (backward compatible).
- **Audit log** — last 5,000 events with timestamps. `AdminAuditLogFilter` writes an entry on every `RequiresElevation` action — answer "who unlocked X for whom last Tuesday" without grepping runtime logs.
- **Progress injection** — set arbitrary counter values for testing / gifting
- **v2.0 testing tools** — grant score / power-up / cosmetic to a user, backfill milestones across all profiles
- **Server-user picker** on the admin/config pages for easier multi-user testing
- **Manual badge revoke (v1.9.8)** — un-award a specific badge from a specific user when needed
- **Integrity test injection (v1.9.8)** — verify daily-cap and suspicious-rate audit flag end-to-end on a throwaway user
- **Admin auth lockdown** — all admin endpoints require elevated permissions

### 🔒 Tracking

- **Watch history backfill** — scans existing Jellyfin play history to retroactively award badges on install
- **Auto-evaluation on startup** — new badges from plugin updates auto-unlock if your existing counters already satisfy them, no manual scan needed
- **Live playback tracker** — unlocks fire during viewing, past the 80% completion threshold
- **Real-watch credit gate (v1.9.8)** — playback events require ≥80% accumulated play ticks with seeks excluded; mark-as-played + seek-to-end + spam-click no longer credit badges
- **60-second minimum runtime** filter so Projectionist prerolls and bumpers can't credit
- **Daily credit cap** (default 200/user/day, configurable) + **`SuspiciousRatePerHour`** audit flag (default 30/h, configurable) for soft anti-abuse
- **Rewatch detection** — dedupes within 6 hours, counts rewatches beyond that
- **People metadata extraction** — uses `ILibraryManager.GetPeople()` for directors/actors

---

## 🎨 Custom badges

> Added in **v2.1.0 "Open Library"**. Admin-only. All endpoints require admin elevation.

Define your own badges with **compound AND/OR criteria** the built-in catalog can't express. The plugin config page (Dashboard → Plugins → Achievement Badges → *Custom Badges*) has a form for **simple** badges (single metric + threshold). For **compound** criteria, icon control, and import/export, use the API below.

### Criteria model

A badge's `criteria` is a tree. A node is **either**:

- a **leaf**: `{ "metric": "<Metric>", "threshold": <int>, "metricParameter": "<optional>" }` — true when the metric value ≥ threshold.
- a **compound**: `{ "operator": "And" | "Or", "children": [ <node>, ... ] }` — true when And(all)/Or(any) of children are true.

Limits: max depth **5**, max **64** nodes per badge, max **500** badges per instance.

### Template — simple badge

```jsonc
// POST /Plugins/AchievementBadges/custom-badges
{
  "name": "Cinephile",
  "description": "Watch 100 films.",
  "rarity": "Rare",            // Common | Uncommon | Rare | Epic | Legendary | Mythic
  "media": "Film",             // Film | TV | Music | Book | Anime | Multi
  "iconUrl": "",               // optional external https URL; blank = default trophy
  "enabled": true,
  "criteria": { "metric": "MoviesWatched", "threshold": 100 }
}
```

### Template — compound (AND / OR)

```jsonc
{
  "name": "Renaissance Viewer",
  "description": "Watch 100 films AND listen to 50 music tracks.",
  "rarity": "Epic",
  "media": "Multi",
  "enabled": true,
  "criteria": {
    "operator": "And",
    "children": [
      { "metric": "MoviesWatched",   "threshold": 100 },
      { "metric": "MusicPlaysTotal", "threshold": 50 }
    ]
  }
}
```

Nested example — *"(finish 5 horror series OR 10h of audiobooks) AND watch 25 anime items"*:

```jsonc
{
  "name": "Eclectic",
  "description": "Genre-spanning dedication.",
  "rarity": "Legendary",
  "media": "Multi",
  "enabled": true,
  "criteria": {
    "operator": "And",
    "children": [
      {
        "operator": "Or",
        "children": [
          { "metric": "SeriesCompleted",         "threshold": 5,  "metricParameter": "Horror" },
          { "metric": "AudiobookListeningHours",  "threshold": 10 }
        ]
      },
      { "metric": "AnimeItemsWatched", "threshold": 25 }
    ]
  }
}
```

### Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET`    | `/Plugins/AchievementBadges/custom-badges`        | List all |
| `GET`    | `/Plugins/AchievementBadges/custom-badges/{id}`   | Fetch one |
| `POST`   | `/Plugins/AchievementBadges/custom-badges`        | Create (fresh id assigned) |
| `PUT`    | `/Plugins/AchievementBadges/custom-badges/{id}`   | Update |
| `DELETE` | `/Plugins/AchievementBadges/custom-badges/{id}`   | Delete |
| `GET`    | `/Plugins/AchievementBadges/custom-badges/export` | Export all as JSON |
| `POST`   | `/Plugins/AchievementBadges/custom-badges/import` | Bulk import (fresh ids) |

### Common metrics

`TotalItemsWatched`, `MoviesWatched`, `SeriesCompleted`, `AnimeItemsWatched`, `DaysWatched`, `CurrentWatchStreak`, `BestWatchStreak`, `UniqueGenresWatched`, `UniqueLanguagesWatched`, `UniqueCountriesWatched`, `MusicPlaysTotal`, `MusicListeningHours`, `UniqueMusicAlbums`, `UniqueMusicArtists`, `UniqueMusicGenres`, `UniqueMusicDecades`, `BooksCompleted`, `AudiobookListeningHours`, `UniqueBookSeriesCompleted`, `MusicGenrePlays`, `MusicGenreListeningHours`, `GenreItemsWatched`. (`metricParameter` applies to parameterized metrics — e.g. `MusicGenrePlays` with `metricParameter` = `"disco"` counts only disco tracks, matched case-insensitively.)

---

## 🛡️ Security & operations

- **Default class-level rate limit** (`user-60-per-min`) on every controller route, with stricter overrides preserved on cooldown routes. Static-asset routes (CSS / JS / translations / video bgs) opt out via `[DisableRateLimiting]` so multi-user households behind a shared NAT don't collectively exhaust the limit.
- **CSP** + `X-Content-Type-Options` + `X-Frame-Options` + `Referrer-Policy` + `Permissions-Policy` on the anonymous profile-card endpoint
- **Per-user chat attachment quota** (200 files / 200 MB total) closes a disk-exhaustion vector
- **SVG sanitizer** blocks `<animate>` / `<set>` SMIL elements that could mutate attributes mid-render
- **Webhook URL DNS resolution** bounded at 3s (was OS default 5-30s)
- **Audit-log endpoint limit** clamped to `[1, 1000]` at controller
- **`MessagingService`** + **`AchievementBadgeService`** are `IDisposable` so the debounced-save Timer is released on plugin reload
- **Unit security regression tests** — SSRF, IPv6 SSRF, scheme rejection, malformed URL rejection, dangerous SVG element rejection, on-event-handler rejection, external DTD rejection, oversized payload rejection, external `<use href>` rejection
- **GitHub Actions CI** runs the tests + `dotnet list package --vulnerable` + `gitleaks` on every push, every PR, and weekly cron
- **CodeQL** + **OpenSSF Scorecard** + **OpenSSF Best Practices Level 1** (project 12937)
- **`SECURITY.md`** with full threat model, trust boundaries, defences-in-place inventory, continuous verification matrix, disclosure SLA, and safe-harbour for researchers
- **Sigstore-signed + SLSA build-provenance attested release artifacts** — verify with `cosign verify-blob` or `gh attestation verify`
- **Reproducible NuGet restore** — every transitive package locked by hash via `RestorePackagesWithLockFile`, CI runs in locked mode so drift fails fast

### ⚡ Plugin-wide efficiency

- **Debounced `Save()`** in `AchievementBadgeService` and `MessagingService` — coalesces back-to-back disk writes from playback and messaging hot paths into one flush per 1.5s
- **`FriendsService.LastWatched` cache** — 90s TTL, invalidated on play, eliminates per-friend 50-item DB query on every friends-list call
- **`WriteIndented = false`** on production stores (~50% smaller `badges.json`)
- **Embedded resource cache** in `client-script` + `asset` routes — one read per process
- **`Cache-Control: public, max-age=86400, immutable`** on assets with version-only cache busting; video backgrounds use HTTP Range so the browser only streams the bytes it needs to start playing
- **`Cache-Control: no-cache, must-revalidate`** on translations (v2.0) so users always get fresh strings after a plugin update without hard-refreshing
- Middleware marker fast-path (last-4KB scan instead of full body)

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
8. Explore `#!/achievements` to see your profile — and the new **Loadout** tab

---

## 🔧 Requirements

- **Jellyfin 10.11+**
- **File Transformation plugin** (strongly recommended) — ensures sidebar, dashboard UI, profile showcase and achievements page inject reliably across Jellyfin Web updates. Without it most UI injection still works via the plugin's own middleware, but File Transformation gives the most robust integration.

### Optional but helpful

- **Proper metadata provider** (TMDb, OMDb) — required for Director/Actor badges to populate. Badges based on `item.People` will stay empty if your library doesn't have people scraped
- **Home Screen Sections plugin** — lets the achievement home widget inject more reliably
- **Custom Tabs or Plugin Pages** — optional alternative hosts for the Achievements page; enable the matching integration under **Page integrations** in plugin settings. Saving installs/repairs the owned Custom Tabs entry without changing existing tabs; restart Jellyfin afterward.

### What each feature needs

| Feature | Depends on |
|---|---|
| Sidebar + header injection | Nothing (works standalone) |
| Custom Tabs page host | Custom Tabs plugin + enable the integration, save, and restart Jellyfin |
| Plugin Pages page host | Plugin Pages plugin + Jellyfin restart after enabling integration |
| Watch history backfill | Played flag on items (Jellyfin default) |
| Genre badges | Items with `Genres` metadata |
| Director/Actor badges | Items with `People` metadata (TMDb/OMDb scrape) |
| Era / decade badges | Items with `ProductionYear` metadata |
| Country badges | Items with `ProductionLocations` metadata |
| Language badges | Items with `OriginalLanguage` metadata |
| Runtime badges | Items with `RunTimeTicks` populated |
| Library completion | At least one library folder with items |
| Webhook notifications | A webhook URL (Discord, Slack, or generic) |
| Animated video backgrounds | Modern browser with H.264 + `<video>` autoplay-muted support (all evergreen browsers) |

---

## 🔍 Troubleshooting

### Sidebar / toasts / UI not showing up

The plugin injects its scripts into Jellyfin's `index.html` at startup. If the web directory isn't writable, the injection fails silently and no UI loads (no sidebar entry, no toasts, no achievements page).

**Diagnose:** visit `https://your-server/Plugins/AchievementBadges/test` — the JSON response shows:
- `DiagIndexFound` — whether `index.html` was located
- `DiagIndexPatched` — whether the script tags were successfully written
- `DiagLastError` — the exact error if patching failed (usually `Unauthorized: Access denied`)

**Common cause:** on Docker or Linux installs, Jellyfin doesn't have write access to `/usr/share/jellyfin/web/`. Fix by granting write permission:

```bash
# Docker: run inside the container
chmod -R a+w /usr/share/jellyfin/web/

# Systemd: fix ownership
sudo chown -R jellyfin:jellyfin /usr/share/jellyfin/web/
```

Then restart Jellyfin. The plugin will patch `index.html` on the next startup.

**Can't (or won't) make the web dir writable? Use the JavaScript Injector plugin (v2.1.0, #26).** On bare-metal Linux where `/usr/share/jellyfin/web` is owned by root, install the [JavaScript Injector plugin](https://github.com/n00bcodr/Jellyfin-JavaScript-Injector). On the next startup, when the on-disk patch fails, Achievement Badges **detects** that plugin and writes the exact script URLs you need into the `/Plugins/AchievementBadges/test` diagnostics (`DiagJsInjectorGuidance`) and the server log. Paste these three into JS Injector's settings — one per entry:

```
/Plugins/AchievementBadges/client-script/sidebar
/Plugins/AchievementBadges/client-script/standalone
/Plugins/AchievementBadges/client-script/enhance
```

Restart Jellyfin and the UI loads through JS Injector — no writable web directory required. (The plugin doesn't call JS Injector's API directly, so this keeps working across JS Injector versions; the on-disk patch remains the default when the dir *is* writable.)

**Still broken?** The plugin has a middleware fallback that rewrites `index.html` at runtime (no disk write needed). If that's also failing, check whether a reverse proxy (nginx/Caddy) is caching a stale `index.html` from before the plugin was installed. Clear the proxy cache or restart it.

### NixOS (read-only `/nix/store`)

NixOS serves Jellyfin's web files from the immutable Nix store, so neither the disk patcher nor the middleware can modify `index.html`. Use a NixOS overlay to inject the script tags at build time:

```nix
nixpkgs.overlays = [
  (final: prev: {
    jellyfin-web = prev.jellyfin-web.overrideAttrs (finalAttrs: previousAttrs: {
      installPhase = ''
        runHook preInstall
        sed -i 's#</body>#<!-- achievementbadges-bootstrap --><script src="/Plugins/AchievementBadges/client-script/sidebar"></script><script src="/Plugins/AchievementBadges/client-script/standalone" defer></script><script src="/Plugins/AchievementBadges/client-script/enhance" defer></script></body>#' dist/index.html
        mkdir -p $out/share
        cp -a dist $out/share/jellyfin-web
        runHook postInstall
      '';
    });
  })
];
```

The plugin DLL serves the JS files from embedded resources — the three `<script>` tags just tell the browser to load them. Rebuild your NixOS config after adding the overlay and restart Jellyfin.

### Video backgrounds don't play

The 4 HD video cosmetics need browser MP4/H.264 + autoplay-muted support. Every evergreen browser handles this fine, but if you see a static page where there should be motion:
- Check the browser's autoplay policy (Chrome: `chrome://flags/#autoplay-policy`)
- The video element is set to `muted + playsinline` so it should autoplay everywhere; if your browser still blocks it, click anywhere on the page once
- Low-end devices (old TVs, basic streamers) may stutter — switch to a CSS-only bg or "None" via Loadout → Cosmetics

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
GET    /Plugins/AchievementBadges/users/{userId}/quests               — daily + weekly + reroll state
GET    /Plugins/AchievementBadges/users/{userId}/bank                 — score bank + prestige
POST   /Plugins/AchievementBadges/users/{userId}/prestige
POST   /Plugins/AchievementBadges/users/{userId}/buy-badge/{badgeId}
POST   /Plugins/AchievementBadges/users/{userId}/gift/{toUserId}?amount=N
GET    /Plugins/AchievementBadges/users/{userId}/chase/{badgeId}      — items to watch to finish a badge
GET    /Plugins/AchievementBadges/users/{userId}/recommendations      — top 3 closest-to-unlock
GET    /Plugins/AchievementBadges/users/{userId}/profile-card         — HTML profile card
GET    /Plugins/AchievementBadges/users/{userId}/unlocks-since?since=ISO&deviceId=ID
GET    /Plugins/AchievementBadges/users/{userId}/library-completion
POST   /Plugins/AchievementBadges/users/{userId}/login-ping
GET    /Plugins/AchievementBadges/leaderboard?limit=10
GET    /Plugins/AchievementBadges/leaderboard/{category}?limit=10     — score|movies|episodes|hours|streak|series
GET    /Plugins/AchievementBadges/embedded-page                       — Plugin Pages host fragment
GET    /Plugins/AchievementBadges/server/stats
```

### v2.0 — Power-ups, Shop, Cosmetics, Quest reroll

```
GET    /Plugins/AchievementBadges/users/{userId}/powerups             — inventory + active state + ScoreBank
POST   /Plugins/AchievementBadges/users/{userId}/powerups/use/{type}  — XpBoost | DoubleCredit (StreakFreeze auto-only)
GET    /Plugins/AchievementBadges/shop/catalog                        — full shop catalog
POST   /Plugins/AchievementBadges/users/{userId}/shop/purchase        — body: {"ItemId":"..."}
GET    /Plugins/AchievementBadges/users/{userId}/cosmetics            — owned + equipped state + LifetimeScore
POST   /Plugins/AchievementBadges/users/{userId}/cosmetics/equip      — body: {"CosmeticId":"..."}
POST   /Plugins/AchievementBadges/users/{userId}/cosmetics/unequip?kind=ProfileTheme|BadgeFrame|RankTitle|Avatar|Background|ProfileBorder
POST   /Plugins/AchievementBadges/users/{userId}/quests/daily/reroll
POST   /Plugins/AchievementBadges/users/{userId}/quests/weekly/reroll
GET    /Plugins/AchievementBadges/asset/{name}                        — animated background mp4s (range-enabled)
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
GET/POST  /Plugins/AchievementBadges/admin/webhook                    — webhook config (incl. HMAC secret)
GET/POST  /Plugins/AchievementBadges/admin/ui-features                — UI feature toggles
GET       /Plugins/AchievementBadges/admin/audit-log?limit=200
POST      /Plugins/AchievementBadges/admin/users/{userId}/inject-counters
GET/POST  /Plugins/AchievementBadges/admin/feature-config             — feature kill switches + admin controls
DELETE    /Plugins/AchievementBadges/admin/users/{userId}/reset       — wipe user's achievement progress

POST   /Plugins/AchievementBadges/admin/users/{userId}/test/inject-playbacks    — verify integrity caps end-to-end (v1.9.8)
DELETE /Plugins/AchievementBadges/admin/users/{userId}/badges/{badgeId}          — manual badge revoke (v1.9.8)

POST   /Plugins/AchievementBadges/admin/users/{userId}/grant-score              — v2.0 testing
POST   /Plugins/AchievementBadges/admin/users/{userId}/grant-powerup/{type}     — v2.0 testing
POST   /Plugins/AchievementBadges/admin/users/{userId}/grant-cosmetic           — v2.0 testing
POST   /Plugins/AchievementBadges/admin/backfill-milestones                     — v2.0: retroactively unlock title milestones across all profiles
```

---

## 📸 Screenshots

### Xbox-style unlock toast
Pops up during playback when a badge unlocks. Xbox circle pops in with pulse rings, expands into a banner, trophy rotates (or diamond spritesheet for rare unlocks), text slides up, shimmer sweeps across, then everything collapses. Per-rarity color, glow, and sound.

<p align="center">
  <img alt="Xbox-style unlock toast" src="assets/achievement-animated.gif" />
</p>

> **Live demo:** download [`achievement-combined.html`](assets/achievement-combined.html) (regular) or [`achievement-combined-rare.html`](assets/achievement-combined-rare.html) (rare with diamond) and open in a browser. Click anywhere to start the sound. Loops every 10.5s.

### The standalone Achievements page
The full profile view, shown in the Jellyfin sidebar. Rank progress bar, day streak, score, completion percentage, and the tab bar (My Badges, Quests, Recap, Leaderboard, Compare, Activity, Wrapped, Stats, and the new **Loadout** tab from v2.0).

<p align="center">
  <img alt="Achievements page" src="assets/screenshots/achievements-page.png" />
</p>

### Badge grid
200+ badges across 35+ categories, each with live progress bars and an Equip button. Unlocked badges show in color with a green status tag; locked badges dim. Rarity-colored borders let you scan the grid visually.

<p align="center">
  <img alt="Badge grid overview" src="assets/screenshots/badges-overview.png" />
</p>

### Rarity tiers in action
Genre specialist badges and streak extremes across all six rarity colors — Common, Uncommon, Rare, Epic, Legendary, Mythic.

<p align="center">
  <img alt="Genre + rarity badges" src="assets/screenshots/genre-badges.png" />
</p>

### Daily and weekly quests
Rotating quests from a template pool. Everyone on the server gets the same daily + weekly challenges so people can race each other. Completing them pays into the score bank. In v2.0, each section header has a reroll button.

<p align="center">
  <img alt="Daily and weekly quests" src="assets/screenshots/quests.png" />
</p>

### Recap
Weekly, monthly and yearly breakdowns of what you've actually watched — total items, active days, top genres, top directors, and top actors.

<p align="center">
  <img alt="Recap view" src="assets/screenshots/recap.png" />
</p>

### Year Wrapped
Spotify-style end-of-year recap with a big gradient hero, "your numbers" (movies, episodes, active days, best streak, total hours), "your highlights" (biggest day, biggest month, most-watched weekday) and "your favorites" (top genres/directors/actors).

<p align="center">
  <img alt="Year Wrapped view" src="assets/screenshots/wrapped.png" />
</p>

### Leaderboard
Podium view for the top 3, ranked list below. Switch categories with the tab row: Score, Movies, Episodes, Hours, Best Streak, Series. (Usernames blurred as User 1–10.)

<p align="center">
  <img alt="Leaderboard view" src="assets/screenshots/leaderboard.png" />
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
Every admin section is collapsible so the page stays clean: webhook notifications, toast preview, UI feature toggles, visual badge editor, challenge templates, audit log, progress injection, custom badges, seasonal challenges, per-badge enable/disable, and the v2.0 testing tools (grant score / power-up / cosmetic, backfill milestones).

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

## 📜 Release history

Full per-version notes and signed binaries live on the GitHub Releases page:

➡ **[github.com/ZL154/AchievementBadges_for_Jellyfin/releases](https://github.com/ZL154/AchievementBadges_for_Jellyfin/releases)**

Highlights:

- **v2.2.0** — Your Screen, Your Rules: optional Custom Tabs + Plugin Pages hosts and independent per-user navigation controls (#37); grouped/individual and all-device/origin-device unlock notification modes (#38); clickable, keyboard-accessible real unlock toasts; 10-toast admin grouping preview; build-specific client cache keys; full 8-language coverage
- **v2.1.3** — Open Library patch: per-genre music badges so genre filters actually filter (#24), custom badges fully delete + purge earned copies + ID-preserving migration (#24), header UI survives another header-injecting plugin (#36), badge-category label fix, and full localization of the badge/quest builders across all 8 languages
- **v2.1.0** — Open Library: music + book achievements, custom badge builder (compound AND/OR), JS Injector fallback (#26), anime detection via Genres+Tags+Series (#25), daily-badge backfill fix + audit/cleanup tool (#27), globe language picker + full admin-page localization
- **v2.0.0** — Choose Your Loadout: power-ups, score shop, 70+ cosmetics, 8 video backgrounds, full i18n
- **v1.9.8** — Integrity release: closes playback-credit exploits (mark-as-played, seek-to-end, spam-click no longer credit), real-watch credit gate (≥80% accumulated play ticks with seeks excluded), 60s minimum runtime filter, daily credit cap, suspicious-rate audit flag, manual badge revoke
- **v1.9.7** — Security-only: per-user chat attachment quota, profile-card CSP tightening, SVG sanitizer adds SMIL blocking, webhook DNS timeout
- **v1.9.6** — Toast description fix, playback popups default-on, server-user picker on admin/config pages
- **v1.9.5** — Chat attachment fix, security hardening
- **v1.9.4** — 32 new badges (afternoon, prime time, holidays expansion, anime tier, studio specialists, pilot vs completer) + 8-language hand-tailored translations
- **v1.9.0** — Revamp UI (Classic/Revamp toggle), Friends drawer Revamp, "Offline — last watched", HMAC webhook signing, security upgrade (rate limit, CSP, audit log filter, GitHub Actions CI)
- **v1.8** — Full messaging suite (1:1 + groups, attachments, read receipts, edit/delete, block, notifications)
- **v1.7** — Friends drawer foundation, hand-translated French by [@frenchyx24](https://github.com/frenchyx24)

---

## ❤ Support the project

Achievement Badges is built and maintained in my spare time. If it's useful to you and you'd like to support ongoing development, any of these means a lot:

- ⭐ **Star this repo** — it's free and helps others find it
- 💖 **[Sponsor on GitHub](https://github.com/sponsors/ZL154)** — one-off or monthly, every dollar reaches the project
- ☕ **[Buy me a coffee on Ko-fi](https://ko-fi.com/zl154)** — one-off tips

Not expected, just appreciated. Contributions — issues, PRs, translation fixes — are equally valuable.

---

## 🙏 Credits & thanks

- **[@frenchyx24](https://github.com/frenchyx24)** — **full French translation of all 171 built-in badges** (hand-translated titles + descriptions, merged in v1.7.2 from [issue #5](https://github.com/ZL154/AchievementBadges_for_Jellyfin/issues/5)). Also filed the original multi-language feature request and the deactivate-equipped-badges / quest-customization / Xbox-logo bug reports that shaped v1.6.1 → v1.7.x. Merci beaucoup !
- **xdnewlun1 (Techno Cricket, CCDC)** — responsible disclosure of 12 security findings in v1.6.0 including the critical IDOR that led to the `UserOwnershipFilter`.
- **Uenify** — the Xbox-style toast animation (circle grow, banner sweep, shimmer, text slide) is a port of his [CodePen](https://codepen.io/uenify) to vanilla JS + per-rarity colour palettes.
- Translations for es / de / it / pt / zh-CN / ja started from an automated pass — native-speaker polish welcomed via PR.

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
- **Background video assets (v2.0)** — sourced from public-domain / royalty-free stock and transcoded to H.264 1080p loops for embedding. No external CDN; all assets ship inside the plugin DLL.

See [LICENSE](LICENSE) for the full license text and third-party notices.

---

⭐ If you use this plugin, consider starring the repository.
