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
  <img src="https://img.shields.io/badge/Version-1.9.0-0b0b0b?style=for-the-badge&labelColor=000000&color=2b2b2b" />
  <img src="https://img.shields.io/badge/License-MIT-0b0b0b?style=for-the-badge&labelColor=000000&color=2b2b2b" />
</p>

# 🏆 Achievement Badges for Jellyfin

A full progression, gamification and achievement system for Jellyfin that rewards users based on real viewing activity. Think Xbox Gamerscore meets Letterboxd, built natively into your media server.

> **Status:** Active development — **v1.9.0** is a major release covering everything since v1.8.10. New: full **Revamp UI** for the user-facing achievements page (magazine hero, conic completion donut, asymmetric stat grid, chapter tabs, control-panel filter strip), **Friends drawer Revamp** following the same Classic/Revamp toggle, **"Offline — last watched X"** line on offline friends, **HMAC-SHA256 webhook signing** for receiver-side authenticity verification, and a `HideLastWatched` privacy preference. Plus a security upgrade (default rate-limiting, admin audit-log filter, CSP headers, **GitHub Actions CI** running the tests + dotnet vulnerability scan + gitleaks on every push) and a plugin-wide efficiency overhaul (debounced saves, friends-bar cache, in-place trims, browser-side asset caching). Prior highlights from v1.8.x: full **messaging suite** (Xbox-style 1:1 + group chats, attachments, read receipts, edit/delete, block, notifications). v1.7.x: Friends drawer foundation, hand-translated **French by [@frenchyx24](https://github.com/frenchyx24)**.

---

## 📑 Table of contents

- [Overview](#-overview)
- [What's new in v1.9.0](#-whats-new-in-v190) — Revamp UI, Friends drawer Revamp, last-watched, HMAC signing, A+ security
- [Core features](#-core-features) — badges, ranks, score, prestige, quests, stats, UI, preferences, admin
- [Messaging (new in v1.8)](#-messaging-new-in-v18) — 1:1 + groups, attachments, read receipts, edit/delete, block
- [Installation](#️-installation)
- [Requirements](#-requirements)
- [Troubleshooting](#-troubleshooting) — permissions, NixOS, reverse proxy
- [API endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Support the project](#-support-the-project)
- [License](#-license)

---

## ✨ Overview

Over **170 built-in achievements** across 30+ categories, a 10-tier rank ladder from Rookie to Immortal, a score economy with combos, prestige, and daily/weekly quests, plus admin power features like custom badges, seasonal challenges, webhook notifications and a full audit log.

Designed to integrate cleanly with modern Jellyfin setups and themes like NetFin, ElegantFin, or StarTrack.

---

## 🚀 What's new in v1.9.0

### 🎨 Revamp UI (toggle anytime)

Every screen the plugin renders now has a Classic/Revamp toggle. Classic stays the v1.8.10 look you know; Revamp is the new design.

- **Achievements page** — magazine-spread hero with massive Geist 700 rank name, **220px conic completion donut** that fills from empty to your real percentage on mount, **asymmetric stats grid** (1 dominant + 3 supporting), **chapter-numbered tabs** (`01 / MY BADGES`, `02 / QUESTS`, `03 / RECAP`…), control-panel filter strip with proper labels and chevrons, ambient drift orb behind the page, film grain overlay, day-streak pulse, rank-name shimmer, full page entrance cascade (topbar → hero → stats → tabs → panel)
- **Admin page** — HUD corner brackets at the four corners of the plugin and personal hero cards, conic rim sheen on Mythic and Legendary badge cards, animated KPI count-up, tier-staggered reveal on badge sections
- **Friends drawer** follows the same Classic/Revamp toggle — sets `body[data-ab-style="revamp"]` so the same tokens apply globally
- One toggle, one preference (`ab-style-pref` localStorage) — flip it in the admin or `/achievements` page settings

### 👥 Friends drawer upgrades

- **Offline — last watched X** — offline friends now show what they watched most recently (mirrors the online "Watching X" treatment). Backed by `IUserDataManager` with reflection-based `LastPlayedDate` lookup
- **`HideLastWatched` privacy preference** — opt out per user, same contract as `AppearOffline` and `HideNowPlaying` (suppressed entirely server-side; never leaks)

### 🔐 Webhook authenticity

- **HMAC-SHA256 signing** — when admin sets `WebhookSigningSecret`, every outbound POST carries:
  ```
  X-AchievementBadges-Signature: sha256=<hex>
  X-AchievementBadges-Timestamp: <unix>
  ```
  Receivers verify with `HMAC(secret, timestamp + "." + raw_body)` and reject stale timestamps to prevent replay. Same envelope as Stripe and GitHub.
- Empty secret = legacy unsigned behaviour (backward compatible).

### 🛡️ Security A+

- **Default class-level rate limit** (`user-60-per-min`) on every controller route, with stricter overrides preserved on cooldown routes
- **`AdminAuditLogFilter`** writes an entry on every `RequiresElevation` action — answer "who unlocked X for whom last Tuesday" without grepping runtime logs
- **CSP** + `X-Content-Type-Options` + `X-Frame-Options` + `Referrer-Policy` + `Permissions-Policy` on the anonymous profile-card endpoint
- **34 xUnit security regression tests** — SSRF, IPv6 SSRF, scheme rejection, malformed URL rejection, dangerous SVG element rejection, on-event-handler rejection, external DTD rejection, oversized payload rejection, external `<use href>` rejection
- **GitHub Actions CI** runs the tests + `dotnet list package --vulnerable` + `gitleaks` on every push, every PR, and weekly cron
- **`SECURITY.md`** expanded with full threat model, trust boundaries, defences-in-place inventory, continuous verification matrix, disclosure SLA, and safe-harbour for researchers
- Three medium audit findings fixed: `GetActivityFeed` / `GetMessageThread` / `GetConvMessages` clamp `page`/`limit`; `WebhookUrlValidator` now fails closed on DNS errors

### ⚡ Plugin-wide efficiency

- **Debounced `Save()`** in `AchievementBadgeService` and `MessagingService` — coalesces back-to-back disk writes from playback and messaging hot paths into one flush per 1.5s
- **`FriendsService.LastWatched` cache** — 90s TTL, invalidated on play, eliminates per-friend 50-item DB query on every friends-list call
- **In-place audit log trim** + tail-walk read (no more `OrderByDescending` on every admin viewer load)
- **`WriteIndented = false`** on production stores (~50% smaller `badges.json`)
- **Embedded resource cache** in `client-script` route — one read per process
- **`Cache-Control: public, max-age=86400, immutable`** on assets with version-only cache busting (browsers actually cache between page loads now)
- Middleware marker fast-path (last-4KB scan instead of full body)

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
- **3 concurrent daily quests** rotating from 12 built-in templates
- **3 concurrent weekly quests** rotating from 8 built-in templates
- Deterministic rotation — everyone on the server gets the same quests per day/week
- Completing quests pays into the score bank
- **Admin quest customization** (new in v1.7.0) — add / edit / remove daily + weekly quests from the admin page, replace built-in quests by Id, or disable built-ins your server can't satisfy

### 👥 Friends (new in v1.7.x)
- **Bi-directional** friendship with a proper **request / accept** flow — nobody follows you silently
- **Global floating button** anchored bottom-left on every Jellyfin page — not just the achievements tab. Auto-hides on `/dashboard` + `/plugins` pages and during media playback; reappears as soon as you leave either state
- **Xbox-guide-style side drawer** with three sub-tabs: Friends / Requests / Find
- **Jellyfin profile-image avatars** per friend row (initials fall back when no image is set)
- **Online / offline** status pulled live from Jellyfin's `ISessionManager`, with a 15-minute grace window so casual browsing still counts as online (not just active playback)
- **Now playing** display — see the series + episode title each online friend is watching
- Each friend's **equipped badges** shown next to their row (respects their privacy prefs)
- **Type-to-search** user picker in the Find tab (not a giant dropdown of every server user)
- **Red unread badge** on the floating button + Requests tab when someone has sent you a friend request
- **Mutual** indicator on friend rows; **Auto-accept** kicks in if the target has already sent a request to you
- **Privacy toggles** in user settings: *Appear offline to friends* (always shows you as offline) and *Hide what I'm watching* (still online, but the series/episode is hidden). Enforced server-side in `FriendsService.BuildFriendRow` — can't be bypassed by client tampering
- **Compact request rows** — Accept / Decline / Cancel buttons are icon-only with tooltips, so the Requests tab doesn't visually bloat

### 💬 Messaging (new in v1.8)

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

### 🏅 Rarity percentage chip (new in v1.7.6)
- Every badge card on the achievements page shows a coloured chip with the **% of users on your server** who have unlocked that badge
- **Green ≥ 50%** (common on this server), **amber 10–50%** (uncommon), **red < 10%** (rare / flex-worthy)
- Fed by a `/badges/rarity-stats` endpoint with a 5-minute server-side cache so it doesn't re-scan every profile on every page load
- Scarcity signal lets users see "nobody else on this server has this badge" at a glance

### 💾 Data-loss recovery chain (v1.7.5+)
- `Load()` walks **primary `badges.json` → `.bak` → `.recovery`** before giving up. A flaky primary file with a clean backup recovers silently
- `.bak` is rotated on every successful save
- `.recovery` captures in-session state when the primary is quarantined, so restart never feels like a fresh reset
- `LastLoadSummary` exposed via the `/test` endpoint so admins can see recovery activity
- Unparseable primary files are quarantined to `badges.json.corrupt-<timestamp>` (not deleted) for manual recovery

### 📊 Stats & visualization
- **Recap tab** — weekly / monthly / yearly breakdowns with top genres, directors, actors
- **Watch heatmap** — GitHub-style calendar (30/90/180/365 day range) colored by intensity
- **Genre radar chart** — SVG spider chart of your genre distribution
- **Stats snapshot** — histogram of unlocked / score / best streak
- **Category leaderboards** — Score, Movies, Episodes, Hours, Best Streak, Series

### 🏠 UI integration
- **Sidebar entry** auto-injected into the Jellyfin nav menu (works on web, iOS, and Android after restart)
- **Equipped badge showcase** in header + profile (configurable slot count, 1-10)
- **Xbox-style unlock toasts** with per-rarity colors (6 tiers), Xbox logo → trophy swap, shimmer sweep, and confetti on rare+ unlocks
- **Achievement sound** — Xbox 360 chime for common/uncommon, rare Xbox One chime for rare/epic/legendary/mythic
- **Diamond spritesheet** for legendary/mythic unlocks (147-frame rotating crystal animation)
- **One-at-a-time toast queue** — multiple simultaneous unlocks play sequentially so each gets its full animation
- **Toasts during playback** — unlocks fire within ~1s of earning via playback event hooks + DOM fallback
- **Admin toast preview** — test buttons for each rarity tier
- **Standalone achievements page** at `#!/achievements`
- **Shareable profile card** — server-rendered HTML at `/Plugins/AchievementBadges/users/{id}/profile-card`

### ⚙️ User preferences
A gear icon on the achievements page opens a full settings panel with auto-save:
- **Toast controls** — enable/disable toasts, sound, confetti, milestone toasts
- **Minimum toast rarity** — filter out common spam (All / Rare+ / Epic+ / Legendary+)
- **Privacy** — hide from leaderboard, compare profiles, activity feed, prestige board
- **Achievement page themes** — Default, Dark, or Light (scoped to achievements page only, doesn't affect Jellyfin)
- **Spoiler mode** — hides locked badge descriptions with "???" so you discover them naturally
- **Equipped badge slots** — choose how many badges show in your showcase (1-10)
- **Auto-equip new unlocks** — newly earned badges automatically fill empty slots

### 🌍 Languages
- **8 languages** — English, Français, Español, Deutsch, Italiano, Português, 中文 (简体), 日本語
- **659 UI keys** translated across every tab (achievements profile, stats, heatmap, streak calendar, prestige leaderboard, notification prefs, server stats, compare, leaderboards, recap, quests, admin page)
- **All 171 built-in badges** translated — titles + descriptions per language
- **Badge categories + rarities** also localised ("Binge" → "Marathon", "Legendary" → "Légendaire", etc.)
- **Per-user language picker** in preferences; admin can set a server-wide default
- Translations loaded client-side + server-side (`BadgeLocalizer`) so both UI chrome and badge titles on the leaderboard / showcase localise together

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
- **JSON editor** alternative for power users
- **Seasonal challenges** — time-limited goals with start/end dates
- **Challenge templates** — one-click add for Monthly Marathon, October Horror, New Year, Summer Blockbuster
- **Webhook notifications** — Discord/Slack-compatible POST on every unlock
- **Audit log** — last 5,000 unlock events with timestamps
- **Progress injection** — set arbitrary counter values for testing / gifting
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
GET/POST  /Plugins/AchievementBadges/admin/feature-config              — feature kill switches + admin controls
DELETE    /Plugins/AchievementBadges/admin/users/{userId}/reset         — wipe user's achievement progress
```

---

See the [Releases page](https://github.com/ZL154/AchievementBadges_for_Jellyfin/releases) for full notes.

---

## 📸 Screenshots

### Xbox-style unlock toast
Pops up during playback when a badge unlocks. Xbox circle pops in with pulse rings, expands into a banner, trophy rotates (or diamond spritesheet for rare unlocks), text slides up, shimmer sweeps across, then everything collapses. Per-rarity color, glow, and sound.

<p align="center">
  <img alt="Xbox-style unlock toast" src="assets/achievement-animated.gif" />
</p>

> **Live demo:** download [`achievement-combined.html`](assets/achievement-combined.html) (regular) or [`achievement-combined-rare.html`](assets/achievement-combined-rare.html) (rare with diamond) and open in a browser. Click anywhere to start the sound. Loops every 10.5s.

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

See [LICENSE](LICENSE) for the full license text and third-party notices.

---

⭐ If you use this plugin, consider starring the repository.
