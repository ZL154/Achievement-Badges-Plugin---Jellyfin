<p align="center">
  <img width="1280" alt="Achievement Badges Banner" src="https://raw.githubusercontent.com/ZL154/AchievementBadges_for_Jellyfin/main/assets/banner.svg" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Jellyfin-10.11%2B-0b0b0b?style=for-the-badge&labelColor=000000&color=2b2b2b" />
  <img src="https://img.shields.io/badge/Type-Plugin-E50914?style=for-the-badge&labelColor=000000&color=E50914" />
  <img src="https://img.shields.io/badge/Badges-49-fbbf24?style=for-the-badge&labelColor=000000" />
  <img src="https://img.shields.io/badge/.NET-9.0-512bd4?style=for-the-badge&labelColor=000000" />
</p>

# Achievement Badges for Jellyfin

A progression and achievement system for Jellyfin that rewards users based on real viewing activity. Track milestones, unlock badges, equip showcases, and compete on leaderboards.

---

## Features

- **49 unlockable achievements** across 11 categories
- **6 rarity tiers** &mdash; Common, Uncommon, Rare, Epic, Legendary, Mythic
- **Progress tracking** with real-time badge evaluation
- **Watch streak system** with daily/best streak tracking
- **Profile showcase** &mdash; equip up to 5 badges to display
- **Leaderboards** with score-based ranking
- **Server statistics** dashboard
- **Sidebar integration** for quick access
- **Dark-themed UI** that matches Jellyfin's native look

---

## Categories

| Category | Badges | Examples |
|---|---|---|
| Getting Started | 5 | First Contact, Jellyfin Resident |
| Binge | 7 | Binge Novice &rarr; Binge Deity (500 items) |
| Films | 6 | Film Curious &rarr; Cinema Historian (300 films) |
| Series | 5 | Series Starter &rarr; Series Master (60 series) |
| Night Watching | 4 | Night Owl, Creature of the Night |
| Morning Watching | 3 | Early Bird, Sunrise Viewer |
| Weekend Watching | 4 | Weekend Warrior &rarr; Weekend Legend |
| Exploration | 3 | Explorer, Collector, Archivist |
| Streaks | 6 | Daily Viewer, Unbroken (100-day streak) |
| Episode Marathons | 4 | Warmup &rarr; Season Sprint (10 eps/day) |
| Film Marathons | 2 | Cinema Day, Movie Marathon |

---

## Installation

1. Go to **Dashboard &rarr; Plugins &rarr; Repositories**
2. Add this manifest URL:

```
https://raw.githubusercontent.com/ZL154/AchievementBadges_for_Jellyfin/main/manifest.json
```

3. Save and refresh the plugin catalogue
4. Install **Achievement Badges**
5. Restart Jellyfin

---

## Requirements

- Jellyfin **10.11+**
- .NET **9.0** runtime

---

## How It Works

The plugin listens to Jellyfin's playback events. When a user completes at least 80% of a movie or episode, it records the completion and evaluates all achievement conditions. Badges unlock automatically as thresholds are reached.

**Scoring** is based on rarity:

| Rarity | Points |
|---|---|
| Common | 10 |
| Uncommon | 20 |
| Rare | 35 |
| Epic | 60 |
| Legendary | 100 |
| Mythic | 150 |

---

## API Endpoints

All endpoints are under `/Plugins/AchievementBadges/`:

| Method | Path | Description |
|---|---|---|
| GET | `users/{userId}` | Get all badges for a user |
| GET | `users/{userId}/summary` | Get user stats summary |
| GET | `users/{userId}/equipped` | Get equipped badges |
| POST | `users/{userId}/equipped/{badgeId}` | Equip a badge |
| DELETE | `users/{userId}/equipped/{badgeId}` | Unequip a badge |
| GET | `users/{userId}/recent-unlocks` | Recently unlocked badges |
| GET | `leaderboard` | Global leaderboard |
| GET | `server/stats` | Server-wide statistics |
| GET | `test` | Health check |

---

## Building from Source

```bash
dotnet build Jellyfin.Plugin.AchievementBadges/Jellyfin.Plugin.AchievementBadges.csproj
```

---

If you use this plugin, consider starring the repository.
