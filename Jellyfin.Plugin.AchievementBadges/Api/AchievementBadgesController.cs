using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.AchievementBadges.Api;

[ApiController]
[Authorize]
[Route("Plugins/AchievementBadges")]
public class AchievementBadgesController : ControllerBase
{
    private readonly AchievementBadgeService _badgeService;
    private readonly PlaybackCompletionService _playbackCompletionService;
    private readonly WatchHistoryBackfillService _backfillService;
    private readonly LibraryCompletionService _libraryCompletionService;
    private readonly RecapService _recapService;
    private readonly RecommendationService _recommendationService;
    private readonly QuestService _questService;
    private readonly AuditLogService _auditLog;

    public AchievementBadgesController(
        AchievementBadgeService badgeService,
        PlaybackCompletionService playbackCompletionService,
        WatchHistoryBackfillService backfillService,
        LibraryCompletionService libraryCompletionService,
        RecapService recapService,
        RecommendationService recommendationService,
        QuestService questService,
        AuditLogService auditLog)
    {
        _badgeService = badgeService;
        _playbackCompletionService = playbackCompletionService;
        _backfillService = backfillService;
        _libraryCompletionService = libraryCompletionService;
        _recapService = recapService;
        _recommendationService = recommendationService;
        _questService = questService;
        _auditLog = auditLog;
    }

    [HttpGet("test")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public ActionResult Test()
    {
        return Ok(new
        {
            Status = "Achievement Badges plugin working!",
            Version = typeof(AchievementBadgesController).Assembly.GetName().Version?.ToString() ?? "unknown",
            InjectionDiag = new
            {
                WebInjectionService.DiagWebPath,
                WebInjectionService.DiagIndexFound,
                WebInjectionService.DiagIndexPatched,
                WebInjectionService.DiagPatchedPath,
                WebInjectionService.DiagLastError
            },
            EmbeddedResources = new
            {
                EnhanceJs = ResourceReader.ReadEmbeddedText("Jellyfin.Plugin.AchievementBadges.Pages.enhance.js") != null,
                SidebarJs = ResourceReader.ReadEmbeddedText("Jellyfin.Plugin.AchievementBadges.Pages.sidebar.js") != null,
                StandaloneJs = ResourceReader.ReadEmbeddedText("Jellyfin.Plugin.AchievementBadges.Pages.standalone.js") != null,
                Spritesheet = typeof(AchievementBadgesController).Assembly.GetManifestResourceStream("Jellyfin.Plugin.AchievementBadges.Pages.spritesheet.png") != null
            }
        });
    }

    [HttpGet("client-script/{name}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult GetClientScript([FromRoute] string name)
    {
        foreach (var ch in name)
        {
            if (!char.IsLetterOrDigit(ch) && ch != '-' && ch != '_')
            {
                return NotFound();
            }
        }

        // Try JS first
        var content = ResourceReader.ReadEmbeddedText(
            "Jellyfin.Plugin.AchievementBadges.Pages." + name + ".js");

        if (content is not null)
        {
            return Content(content, "application/javascript");
        }

        // Try binary assets (PNG for spritesheet, etc.)
        var assembly = typeof(AchievementBadgesController).Assembly;
        string[] extensions = { ".png", ".mp3", ".svg" };
        string[] mimeTypes = { "image/png", "audio/mpeg", "image/svg+xml" };
        for (int i = 0; i < extensions.Length; i++)
        {
            var resourceName = "Jellyfin.Plugin.AchievementBadges.Pages." + name + extensions[i];
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream != null)
            {
                var bytes = new byte[stream.Length];
                stream.Read(bytes, 0, bytes.Length);
                return File(bytes, mimeTypes[i]);
            }
        }

        return NotFound();
    }

    [HttpGet("users/{userId}")]
    [ProducesResponseType(typeof(List<AchievementBadge>), StatusCodes.Status200OK)]
    public ActionResult<List<AchievementBadge>> GetBadgesForUser([FromRoute] string userId)
    {
        var badges = _badgeService.GetBadgesForUser(userId);
        return Ok(badges);
    }

    [HttpGet("users/{userId}/badge/{badgeId}")]
    [ProducesResponseType(typeof(AchievementBadge), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<AchievementBadge> GetBadge([FromRoute] string userId, [FromRoute] string badgeId)
    {
        var badge = _badgeService.GetBadge(userId, badgeId);

        if (badge is null)
        {
            return NotFound();
        }

        return Ok(badge);
    }

    [HttpGet("users/{userId}/newly-unlocked")]
    [ProducesResponseType(typeof(List<AchievementBadge>), StatusCodes.Status200OK)]
    public ActionResult<List<AchievementBadge>> GetNewlyUnlocked([FromRoute] string userId)
    {
        var badges = _badgeService.GetBadgesForUser(userId)
            .FindAll(b => b.Unlocked && b.UnlockedAt.HasValue);

        return Ok(badges);
    }

    [HttpGet("users/{userId}/recent-unlocks")]
    [ProducesResponseType(typeof(List<AchievementBadge>), StatusCodes.Status200OK)]
    public ActionResult<List<AchievementBadge>> GetRecentUnlocks([FromRoute] string userId, [FromQuery] int limit = 8)
    {
        if (limit < 1)
        {
            limit = 1;
        }

        if (limit > 50)
        {
            limit = 50;
        }

        var badges = _badgeService.GetBadgesForUser(userId)
            .Where(b => b.Unlocked && b.UnlockedAt.HasValue)
            .OrderByDescending(b => b.UnlockedAt)
            .Take(limit)
            .ToList();

        return Ok(badges);
    }

    [HttpGet("users/{userId}/next-badges")]
    [ProducesResponseType(typeof(List<AchievementBadge>), StatusCodes.Status200OK)]
    public ActionResult<List<AchievementBadge>> GetNextBadges([FromRoute] string userId, [FromQuery] int limit = 5)
    {
        if (limit < 1)
        {
            limit = 1;
        }

        if (limit > 20)
        {
            limit = 20;
        }

        var badges = _badgeService.GetBadgesForUser(userId)
            .Where(b => !b.Unlocked && b.TargetValue > 0)
            .OrderByDescending(b => (double)b.CurrentValue / b.TargetValue)
            .ThenBy(b => b.TargetValue - b.CurrentValue)
            .Take(limit)
            .ToList();

        return Ok(badges);
    }

    [HttpGet("users/{userId}/playback-state")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetPlaybackState([FromRoute] string userId)
    {
        var state = _playbackCompletionService.GetState(userId);
        return Ok(state);
    }

    [HttpPost("users/{userId}/record-completion")]
    [ProducesResponseType(typeof(List<AchievementBadge>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public ActionResult<List<AchievementBadge>> RecordCompletion(
        [FromRoute] string userId,
        [FromQuery] string? itemId = null,
        [FromQuery] double completionPercent = 100,
        [FromQuery] bool isMovie = false,
        [FromQuery] bool isEpisode = true,
        [FromQuery] bool isSeriesCompleted = false)
    {
        var success = _playbackCompletionService.RecordCompletion(
            userId,
            itemId,
            isMovie,
            isEpisode,
            isSeriesCompleted,
            completionPercent,
            System.DateTimeOffset.Now,
            out var message);

        if (!success)
        {
            return BadRequest(new { Message = message });
        }

        var badges = _badgeService.GetBadgesForUser(userId);
        return Ok(badges);
    }

    [HttpPost("users/{userId}/unlock/{badgeId}")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(typeof(AchievementBadge), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<AchievementBadge> UnlockBadge([FromRoute] string userId, [FromRoute] string badgeId)
    {
        var badge = _badgeService.UnlockBadge(userId, badgeId);

        if (badge is null)
        {
            return NotFound();
        }

        return Ok(badge);
    }

    [HttpPost("users/{userId}/progress/{badgeId}")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(typeof(AchievementBadge), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<AchievementBadge> AddProgress(
        [FromRoute] string userId,
        [FromRoute] string badgeId,
        [FromQuery] int amount = 1)
    {
        var badge = _badgeService.UpdateProgress(userId, badgeId, amount);

        if (badge is null)
        {
            return NotFound();
        }

        return Ok(badge);
    }

    [HttpPost("users/{userId}/simulate-playback")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(typeof(List<AchievementBadge>), StatusCodes.Status200OK)]
    public ActionResult<List<AchievementBadge>> SimulatePlayback(
        [FromRoute] string userId,
        [FromQuery] bool isMovie = false,
        [FromQuery] bool isSeriesCompleted = false)
    {
        _badgeService.RecordPlayback(
            userId,
            isMovie,
            !isMovie,
            isSeriesCompleted,
            null,
            System.DateTimeOffset.Now);

        var badges = _badgeService.GetBadgesForUser(userId);
        return Ok(badges);
    }

    [HttpPost("users/{userId}/reset")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(typeof(List<AchievementBadge>), StatusCodes.Status200OK)]
    public ActionResult<List<AchievementBadge>> ResetBadges([FromRoute] string userId)
    {
        var badges = _badgeService.ResetBadgesForUser(userId);
        return Ok(badges);
    }

    [HttpGet("users/{userId}/equipped")]
    [ProducesResponseType(typeof(List<AchievementBadge>), StatusCodes.Status200OK)]
    public ActionResult<List<AchievementBadge>> GetEquipped([FromRoute] string userId)
    {
        var badges = _badgeService.GetEquippedBadges(userId);
        return Ok(badges);
    }

    [HttpPost("users/{userId}/equipped/{badgeId}")]
    [ProducesResponseType(typeof(List<AchievementBadge>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public ActionResult<List<AchievementBadge>> EquipBadge([FromRoute] string userId, [FromRoute] string badgeId)
    {
        var success = _badgeService.EquipBadge(userId, badgeId, out var message);

        if (!success)
        {
            return BadRequest(new { Message = message });
        }

        var badges = _badgeService.GetEquippedBadges(userId);
        return Ok(badges);
    }

    [HttpDelete("users/{userId}/equipped/{badgeId}")]
    [ProducesResponseType(typeof(List<AchievementBadge>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public ActionResult<List<AchievementBadge>> UnequipBadge([FromRoute] string userId, [FromRoute] string badgeId)
    {
        var success = _badgeService.UnequipBadge(userId, badgeId, out var message);

        if (!success)
        {
            return BadRequest(new { Message = message });
        }

        var badges = _badgeService.GetEquippedBadges(userId);
        return Ok(badges);
    }

    [HttpGet("users/{userId}/summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetSummary([FromRoute] string userId)
    {
        var summary = _badgeService.GetSummary(userId);
        return Ok(summary);
    }

    [HttpGet("leaderboard")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetLeaderboard([FromQuery] int limit = 10)
    {
        var leaderboard = _badgeService.GetLeaderboard(limit);
        return Ok(leaderboard);
    }

    [HttpGet("server/stats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetServerStats()
    {
        var stats = _badgeService.GetServerStats();
        return Ok(stats);
    }

    [HttpPost("users/{userId}/backfill")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult BackfillUser([FromRoute] string userId)
    {
        var result = _backfillService.BackfillUser(userId);
        return Ok(result);
    }

    [HttpPost("backfill-all")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult BackfillAll()
    {
        var result = _backfillService.BackfillAllUsers();
        return Ok(result);
    }

    [HttpGet("admin/badge-catalog")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetBadgeCatalog()
    {
        var config = Plugin.Instance?.Configuration;
        var disabled = new HashSet<string>(
            config?.DisabledBadgeIds ?? new List<string>(),
            StringComparer.OrdinalIgnoreCase);

        var catalog = AchievementDefinitions.All
            .GroupBy(d => d.Category)
            .Select(g => new
            {
                Category = g.Key,
                Badges = g.Select(d => new
                {
                    d.Id,
                    d.Title,
                    d.Description,
                    d.Icon,
                    d.Rarity,
                    d.TargetValue,
                    Disabled = disabled.Contains(d.Id)
                }).ToList()
            })
            .ToList();

        return Ok(new
        {
            Catalog = catalog,
            DisabledBadgeIds = disabled.ToList()
        });
    }

    public class BadgeToggleRequest
    {
        public string? BadgeId { get; set; }
        public bool Disabled { get; set; }
    }

    public class BadgeBulkToggleRequest
    {
        public List<string>? DisabledBadgeIds { get; set; }
    }

    [HttpPost("admin/badge-catalog/toggle")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult ToggleBadge([FromBody] BadgeToggleRequest request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.BadgeId))
        {
            return BadRequest(new { Message = "BadgeId is required." });
        }

        var plugin = Plugin.Instance;
        if (plugin is null)
        {
            return BadRequest(new { Message = "Plugin instance not available." });
        }

        var config = plugin.Configuration;
        config.DisabledBadgeIds ??= new List<string>();

        var exists = config.DisabledBadgeIds
            .Any(id => id.Equals(request.BadgeId, StringComparison.OrdinalIgnoreCase));

        if (request.Disabled && !exists)
        {
            config.DisabledBadgeIds.Add(request.BadgeId);
        }
        else if (!request.Disabled && exists)
        {
            config.DisabledBadgeIds.RemoveAll(id =>
                id.Equals(request.BadgeId, StringComparison.OrdinalIgnoreCase));
        }

        plugin.UpdateConfiguration(config);
        return Ok(new { Success = true, DisabledBadgeIds = config.DisabledBadgeIds });
    }

    [HttpPost("admin/badge-catalog/bulk")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult BulkSetDisabled([FromBody] BadgeBulkToggleRequest request)
    {
        var plugin = Plugin.Instance;
        if (plugin is null)
        {
            return BadRequest(new { Message = "Plugin instance not available." });
        }

        var config = plugin.Configuration;
        config.DisabledBadgeIds = (request?.DisabledBadgeIds ?? new List<string>())
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        plugin.UpdateConfiguration(config);
        return Ok(new { Success = true, DisabledBadgeIds = config.DisabledBadgeIds });
    }

    // ---------- Rank -------------------------------------------------

    [HttpGet("users/{userId}/rank")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetRank([FromRoute] string userId)
    {
        var summary = _badgeService.GetSummary(userId);
        var score = (int)(summary.GetType().GetProperty("Score")?.GetValue(summary) ?? 0);
        var tier = RankHelper.GetTier(score);
        var next = RankHelper.GetNextTier(score);
        var prevMin = tier.MinScore;
        var nextMin = next?.MinScore ?? tier.MinScore;
        var progress = next is null ? 100 : (int)Math.Round(100.0 * (score - prevMin) / Math.Max(1, nextMin - prevMin));

        return Ok(new
        {
            Score = score,
            Tier = new { tier.Name, tier.MinScore, tier.Color, tier.Icon },
            NextTier = next is null ? null : (object)new { next.Name, next.MinScore, next.Color, next.Icon },
            ProgressToNext = progress,
            Tiers = RankHelper.Tiers.Select(t => new { t.Name, t.MinScore, t.Color, t.Icon })
        });
    }

    [HttpGet("ranks")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetAllRanks()
    {
        return Ok(RankHelper.Tiers.Select(t => new { t.Name, t.MinScore, t.Color, t.Icon }));
    }

    // ---------- Library completion ----------------------------------

    [HttpPost("users/{userId}/library-completion/recompute")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult RecomputeLibraryCompletion([FromRoute] string userId)
    {
        if (!Guid.TryParse(userId, out var guid))
        {
            return BadRequest(new { Message = "Invalid user id." });
        }
        var result = _libraryCompletionService.RecomputeForUser(guid);
        return Ok(new { LibraryCompletionPercents = result });
    }

    [HttpGet("users/{userId}/library-completion")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetLibraryCompletion([FromRoute] string userId)
    {
        var profile = _badgeService.PeekProfile(userId);
        return Ok(new { LibraryCompletionPercents = profile?.Counters.LibraryCompletionPercents ?? new Dictionary<string, int>() });
    }

    // ---------- v1.5.6 features --------------------------------------

    [HttpGet("compare/{userIdA}/{userIdB}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult CompareUsers([FromRoute] string userIdA, [FromRoute] string userIdB)
    {
        _badgeService.RecordCompareHistory(userIdA, userIdB);
        return Ok(_badgeService.CompareUsers(userIdA, userIdB));
    }

    [HttpGet("users/{userId}/compare-history")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetCompareHistory([FromRoute] string userId)
    {
        return Ok(_badgeService.GetCompareHistory(userId));
    }

    [HttpGet("users/{userId}/smart-goals")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetSmartGoals([FromRoute] string userId, [FromQuery] int limit = 5)
    {
        return Ok(_badgeService.GetSmartGoals(userId, limit));
    }

    [HttpGet("users/{userId}/preferences")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetUserPreferences([FromRoute] string userId)
    {
        return Ok(_badgeService.GetUserPreferences(userId));
    }

    [HttpPost("users/{userId}/preferences")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult SaveUserPreferences([FromRoute] string userId, [FromBody] UserNotificationPreferences prefs)
    {
        _badgeService.SaveUserPreferences(userId, prefs);
        return Ok(new { Success = true });
    }

    [HttpGet("activity-feed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetActivityFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? userId = null)
    {
        return Ok(_badgeService.GetActivityFeed(page, pageSize, userId));
    }

    [HttpGet("users/{userId}/check-milestones")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult CheckMilestones([FromRoute] string userId)
    {
        return Ok(_badgeService.CheckMilestones(userId));
    }

    [HttpGet("users/{userId}/streak-calendar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetStreakCalendar([FromRoute] string userId, [FromQuery] int weeks = 53)
    {
        return Ok(_badgeService.GetStreakCalendar(userId, weeks));
    }

    [HttpGet("users/{userId}/badge-eta")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetBadgeEtas([FromRoute] string userId, [FromQuery] int limit = 50)
    {
        return Ok(_badgeService.GetBadgeEtas(userId, limit));
    }

    [HttpGet("users/{userId}/wrapped")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetYearlyWrapped([FromRoute] string userId, [FromQuery] int? year = null)
    {
        return Ok(_badgeService.GetYearlyWrapped(userId, year ?? DateTime.Today.Year));
    }

    [HttpGet("users/{userId}/records")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetPersonalRecords([FromRoute] string userId)
    {
        return Ok(_badgeService.GetPersonalRecords(userId));
    }

    [HttpGet("users/{userId}/category-progress")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetCategoryProgress([FromRoute] string userId)
    {
        return Ok(_badgeService.GetCategoryProgress(userId));
    }

    [HttpGet("leaderboard-prestige")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetPrestigeLeaderboard([FromQuery] int limit = 10)
    {
        return Ok(_badgeService.GetPrestigeLeaderboard(limit));
    }

    [HttpGet("users/{userId}/recent-unlocks-v2")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetRecentUnlocksV2([FromRoute] string userId, [FromQuery] int limit = 20)
    {
        return Ok(_badgeService.GetRecentUnlocks(userId, limit));
    }

    [HttpGet("users/{userId}/watch-clock")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetWatchClock([FromRoute] string userId)
    {
        return Ok(_badgeService.GetWatchHourClock(userId));
    }

    public class PinBadgeRequest { public bool Pinned { get; set; } }

    [HttpPost("users/{userId}/pin/{badgeId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult PinBadge([FromRoute] string userId, [FromRoute] string badgeId, [FromBody] PinBadgeRequest? body)
    {
        return Ok(_badgeService.PinBadge(userId, badgeId, body?.Pinned ?? true));
    }

    public class EquipTitleRequest { public string? BadgeId { get; set; } }

    [HttpPost("users/{userId}/title")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult EquipTitle([FromRoute] string userId, [FromBody] EquipTitleRequest? body)
    {
        return Ok(_badgeService.EquipTitle(userId, body?.BadgeId));
    }

    [HttpGet("users/{userId}/title")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetEquippedTitle([FromRoute] string userId)
    {
        return Ok(_badgeService.GetEquippedTitle(userId));
    }

    // ---------- Watch calendar (for heatmap) ------------------------

    [HttpGet("users/{userId}/watch-calendar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetWatchCalendar([FromRoute] string userId, [FromQuery] int days = 90)
    {
        return Ok(new { Days = days, Counts = _badgeService.GetWatchCalendar(userId, days) });
    }

    // ---------- Recap ------------------------------------------------

    [HttpGet("users/{userId}/recap")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetRecap([FromRoute] string userId, [FromQuery] string period = "week")
    {
        return Ok(_recapService.GetRecap(userId, period));
    }

    // ---------- Login ping -------------------------------------------

    [HttpPost("users/{userId}/login-ping")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult LoginPing([FromRoute] string userId)
    {
        _badgeService.RegisterLogin(userId);
        return Ok(new { Success = true });
    }

    // ---------- Newly unlocked since timestamp ----------------------

    [HttpGet("users/{userId}/unlocks-since")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetUnlocksSince([FromRoute] string userId, [FromQuery] string? since = null)
    {
        var cutoff = DateTimeOffset.MinValue;
        if (!string.IsNullOrWhiteSpace(since) && DateTimeOffset.TryParse(since, out var parsed))
        {
            cutoff = parsed;
        }

        var badges = _badgeService.GetBadgesForUser(userId)
            .Where(b => b.Unlocked && b.UnlockedAt.HasValue && b.UnlockedAt.Value > cutoff)
            .OrderByDescending(b => b.UnlockedAt)
            .ToList();

        return Ok(new { Now = DateTimeOffset.UtcNow, Badges = badges });
    }

    // ---------- Profile card (HTML) ---------------------------------

    [HttpGet("users/{userId}/profile-card")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public ActionResult GetProfileCard([FromRoute] string userId)
    {
        var content = ResourceReader.ReadEmbeddedText("Jellyfin.Plugin.AchievementBadges.Pages.profile-card.html")
            ?? "<html><body>Profile card template missing.</body></html>";

        // Pre-fetch all the data server-side so the rendered HTML works without
        // needing the client to make authenticated fetches (which fail because
        // the tab has no X-Emby-Token).
        try
        {
            var summary = _badgeService.GetSummary(userId);
            var summaryType = summary.GetType();
            int score = (int)(summaryType.GetProperty("Score")?.GetValue(summary) ?? 0);
            int unlocked = (int)(summaryType.GetProperty("Unlocked")?.GetValue(summary) ?? 0);
            int total = (int)(summaryType.GetProperty("Total")?.GetValue(summary) ?? 0);
            double percentage = (double)(summaryType.GetProperty("Percentage")?.GetValue(summary) ?? 0.0);
            int bestStreak = (int)(summaryType.GetProperty("BestWatchStreak")?.GetValue(summary) ?? 0);

            var tier = RankHelper.GetTier(score);
            var next = RankHelper.GetNextTier(score);
            var progress = next is null ? 100 : (int)Math.Round(100.0 * (score - tier.MinScore) / Math.Max(1, next.MinScore - tier.MinScore));

            var equipped = _badgeService.GetEquippedBadges(userId);
            var equippedHtml = string.Concat(equipped.Select(b =>
                $"<span class=\"badge-chip\">{System.Net.WebUtility.HtmlEncode(b.Title)}</span>"));
            if (string.IsNullOrWhiteSpace(equippedHtml))
            {
                equippedHtml = "<span class=\"tier\">No badges equipped.</span>";
            }

            var recap = _recapService.GetRecap(userId, "month");
            var recapType = recap.GetType();
            int recapMovies = (int)(recapType.GetProperty("MoviesWatched")?.GetValue(recap) ?? 0);
            int recapEpisodes = (int)(recapType.GetProperty("EpisodesWatched")?.GetValue(recap) ?? 0);
            int recapUnlocks = (int)(recapType.GetProperty("BadgesUnlocked")?.GetValue(recap) ?? 0);

            var streakData = _badgeService.GetStreakCalendar(userId, 53);
            int currentStreak = (int)(streakData.GetType().GetProperty("CurrentStreak")?.GetValue(streakData) ?? 0);

            content = content
                .Replace("{{userId}}", userId)
                .Replace("{{score}}", score.ToString())
                .Replace("{{unlocked}}", unlocked.ToString())
                .Replace("{{total}}", total.ToString())
                .Replace("{{percentage}}", percentage.ToString("0.#"))
                .Replace("{{bestStreak}}", bestStreak.ToString())
                .Replace("{{currentStreak}}", currentStreak.ToString())
                .Replace("{{tierName}}", tier.Name)
                .Replace("{{tierColor}}", tier.Color)
                .Replace("{{progressToNext}}", progress.ToString())
                .Replace("{{nextTierLabel}}", next is null ? "Max rank" : $"{next.MinScore - score} to {next.Name}")
                .Replace("{{recapMovies}}", recapMovies.ToString())
                .Replace("{{recapEpisodes}}", recapEpisodes.ToString())
                .Replace("{{recapUnlocks}}", recapUnlocks.ToString())
                .Replace("{{equippedHtml}}", equippedHtml);
        }
        catch (Exception ex)
        {
            content = content.Replace("{{userId}}", userId ?? string.Empty);
            return Content($"<html><body style='background:#111;color:#fff;font-family:sans-serif;padding:2em;'><h1>Profile card error</h1><p>{System.Net.WebUtility.HtmlEncode(ex.Message)}</p></body></html>", "text/html");
        }

        return Content(content, "text/html");
    }

    // ---------- Leaderboard categories ------------------------------

    [HttpGet("leaderboard/{category}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetCategoryLeaderboard([FromRoute] string category, [FromQuery] int limit = 10)
    {
        return Ok(_badgeService.GetLeaderboardByCategory(category, limit));
    }

    // ---------- Custom badges (admin) -------------------------------

    [HttpGet("admin/custom-badges")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetCustomBadges()
    {
        return Ok(Plugin.Instance?.Configuration?.CustomBadges ?? new List<AchievementDefinition>());
    }

    [HttpPost("admin/custom-badges")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult SaveCustomBadges([FromBody] List<AchievementDefinition> badges)
    {
        var plugin = Plugin.Instance;
        if (plugin is null) return BadRequest();
        var config = plugin.Configuration;
        config.CustomBadges = (badges ?? new()).Where(b => !string.IsNullOrWhiteSpace(b.Id)).ToList();
        foreach (var b in config.CustomBadges) { b.IsCustom = true; }
        plugin.UpdateConfiguration(config);
        return Ok(new { Count = config.CustomBadges.Count });
    }

    // ---------- Challenges (admin) ----------------------------------

    [HttpGet("admin/challenges")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetChallenges()
    {
        return Ok(Plugin.Instance?.Configuration?.Challenges ?? new List<AchievementDefinition>());
    }

    [HttpPost("admin/challenges")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult SaveChallenges([FromBody] List<AchievementDefinition> challenges)
    {
        var plugin = Plugin.Instance;
        if (plugin is null) return BadRequest();
        var config = plugin.Configuration;
        config.Challenges = (challenges ?? new()).Where(b => !string.IsNullOrWhiteSpace(b.Id)).ToList();
        foreach (var c in config.Challenges) { c.IsChallenge = true; }
        plugin.UpdateConfiguration(config);
        return Ok(new { Count = config.Challenges.Count });
    }

    // ---------- Webhook config (admin) ------------------------------

    public class WebhookConfigRequest
    {
        public string? WebhookUrl { get; set; }
        public bool WebhookEnabled { get; set; }
        public string? WebhookMessageTemplate { get; set; }
    }

    [HttpGet("admin/webhook")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetWebhookConfig()
    {
        var c = Plugin.Instance?.Configuration;
        return Ok(new
        {
            WebhookUrl = c?.WebhookUrl,
            WebhookEnabled = c?.WebhookEnabled ?? false,
            WebhookMessageTemplate = c?.WebhookMessageTemplate
        });
    }

    [HttpPost("admin/webhook")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult SaveWebhookConfig([FromBody] WebhookConfigRequest request)
    {
        var plugin = Plugin.Instance;
        if (plugin is null) return BadRequest();
        var config = plugin.Configuration;
        config.WebhookUrl = request?.WebhookUrl;
        config.WebhookEnabled = request?.WebhookEnabled ?? false;
        if (!string.IsNullOrWhiteSpace(request?.WebhookMessageTemplate))
        {
            config.WebhookMessageTemplate = request.WebhookMessageTemplate!;
        }
        plugin.UpdateConfiguration(config);
        return Ok(new { Success = true });
    }

    // ---------- UI config (admin) -----------------------------------

    public class UiFeatureFlagsRequest
    {
        public bool EnableUnlockToasts { get; set; } = true;
        public bool EnableHomeWidget { get; set; } = true;
        public bool EnableItemDetailRibbon { get; set; } = false;
    }

    [HttpGet("admin/ui-features")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetUiFeatures()
    {
        var c = Plugin.Instance?.Configuration;
        return Ok(new
        {
            EnableUnlockToasts = c?.EnableUnlockToasts ?? true,
            EnableHomeWidget = c?.EnableHomeWidget ?? true,
            EnableItemDetailRibbon = c?.EnableItemDetailRibbon ?? true
        });
    }

    [HttpPost("admin/ui-features")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult SaveUiFeatures([FromBody] UiFeatureFlagsRequest request)
    {
        var plugin = Plugin.Instance;
        if (plugin is null) return BadRequest();
        var config = plugin.Configuration;
        config.EnableUnlockToasts = request?.EnableUnlockToasts ?? true;
        config.EnableHomeWidget = request?.EnableHomeWidget ?? true;
        config.EnableItemDetailRibbon = request?.EnableItemDetailRibbon ?? true;
        plugin.UpdateConfiguration(config);
        return Ok(new { Success = true });
    }

    // ---------- Prestige + score bank --------------------------------

    [HttpPost("users/{userId}/prestige")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult Prestige([FromRoute] string userId)
    {
        return Ok(_badgeService.PrestigeReset(userId));
    }

    [HttpGet("users/{userId}/bank")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetBank([FromRoute] string userId)
    {
        var profile = _badgeService.PeekProfile(userId);
        return Ok(new
        {
            ScoreBank = profile?.ScoreBank ?? 0,
            LifetimeScore = profile?.LifetimeScore ?? 0,
            PrestigeLevel = profile?.PrestigeLevel ?? 0,
            BoughtBadgeIds = profile?.BoughtBadgeIds ?? new List<string>(),
            ComboCount = profile?.ComboCount ?? 0,
            BestComboCount = profile?.BestComboCount ?? 0,
            PinnedBadgeIds = profile?.PinnedBadgeIds ?? new List<string>(),
            EquippedTitleBadgeId = profile?.EquippedTitleBadgeId
        });
    }

    [HttpPost("users/{userId}/buy-badge/{badgeId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult BuyBadge([FromRoute] string userId, [FromRoute] string badgeId)
    {
        var result = _badgeService.SpendScoreForBadge(userId, badgeId);
        return Ok(result);
    }

    [HttpPost("users/{userId}/gift/{toUserId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GiftScore([FromRoute] string userId, [FromRoute] string toUserId, [FromQuery] int amount = 0)
    {
        var result = _badgeService.GiftScore(userId, toUserId, amount);
        return Ok(result);
    }

    // ---------- Daily quest ------------------------------------------

    [HttpGet("users/{userId}/daily-quest")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetDailyQuest([FromRoute] string userId)
    {
        return Ok(_questService.GetOrCreateDaily(userId));
    }

    [HttpGet("users/{userId}/weekly-quest")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetWeeklyQuest([FromRoute] string userId)
    {
        return Ok(_questService.GetOrCreateWeekly(userId));
    }

    [HttpGet("users/{userId}/quests")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetAllQuests([FromRoute] string userId)
    {
        return Ok(_questService.GetOrCreate(userId));
    }

    // ---------- Recommendations --------------------------------------

    [HttpGet("users/{userId}/chase/{badgeId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult ChaseBadge([FromRoute] string userId, [FromRoute] string badgeId, [FromQuery] int limit = 10)
    {
        return Ok(_recommendationService.ChaseBadge(userId, badgeId, limit));
    }

    [HttpGet("users/{userId}/recommendations")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetRecommendations([FromRoute] string userId, [FromQuery] int limit = 10)
    {
        return Ok(_recommendationService.GetRecommendations(userId, limit));
    }

    // ---------- Export / import / per-badge reset --------------------

    [HttpGet("users/{userId}/export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult ExportProfile([FromRoute] string userId)
    {
        return Ok(_badgeService.ExportProfile(userId));
    }

    [HttpPost("users/{userId}/import")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult ImportProfile([FromRoute] string userId, [FromBody] UserAchievementProfile profile)
    {
        _badgeService.ImportProfile(userId, profile);
        return Ok(new { Success = true });
    }

    [HttpPost("users/{userId}/reset-badge/{badgeId}")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult ResetBadge([FromRoute] string userId, [FromRoute] string badgeId)
    {
        _badgeService.ResetBadge(userId, badgeId);
        return Ok(new { Success = true });
    }

    public class InjectCountersRequest
    {
        public Dictionary<string, long>? Counters { get; set; }
    }

    [HttpPost("admin/users/{userId}/inject-counters")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult InjectCounters([FromRoute] string userId, [FromBody] InjectCountersRequest request)
    {
        _badgeService.InjectCounters(userId, request?.Counters ?? new());
        return Ok(new { Success = true });
    }

    // ---------- Audit log --------------------------------------------

    [HttpGet("admin/audit-log")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetAuditLog([FromQuery] int limit = 200)
    {
        return Ok(_auditLog.GetRecent(limit));
    }

    // ---------- Challenge templates -----------------------------------

    [HttpGet("admin/challenge-templates")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetChallengeTemplates()
    {
        var now = DateTimeOffset.Now;
        var monthEnd = new DateTimeOffset(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, now.Offset);
        return Ok(new[]
        {
            new AchievementDefinition
            {
                Id = "challenge-monthly-10-movies", Title = "Monthly Movie Marathon", Description = "Watch 10 movies this month.",
                Icon = "movie", Category = "Challenge", Rarity = "Epic", Metric = AchievementMetric.MoviesWatched, TargetValue = 10,
                ChallengeStart = now, ChallengeEnd = monthEnd
            },
            new AchievementDefinition
            {
                Id = "challenge-october-horror", Title = "October Horror Month", Description = "Watch 15 items during October.",
                Icon = "whatshot", Category = "Challenge", Rarity = "Legendary", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 15,
                ChallengeStart = new DateTimeOffset(now.Year, 10, 1, 0, 0, 0, now.Offset),
                ChallengeEnd = new DateTimeOffset(now.Year, 10, 31, 23, 59, 59, now.Offset)
            },
            new AchievementDefinition
            {
                Id = "challenge-new-year", Title = "New Year's Resolution", Description = "Watch 20 items in January.",
                Icon = "cake", Category = "Challenge", Rarity = "Rare", Metric = AchievementMetric.TotalItemsWatched, TargetValue = 20,
                ChallengeStart = new DateTimeOffset(now.Year, 1, 1, 0, 0, 0, now.Offset),
                ChallengeEnd = new DateTimeOffset(now.Year, 1, 31, 23, 59, 59, now.Offset)
            },
            new AchievementDefinition
            {
                Id = "challenge-summer-blockbuster", Title = "Summer Blockbuster Season", Description = "Watch 10 movies between June and August.",
                Icon = "wb_sunny", Category = "Challenge", Rarity = "Epic", Metric = AchievementMetric.MoviesWatched, TargetValue = 10,
                ChallengeStart = new DateTimeOffset(now.Year, 6, 1, 0, 0, 0, now.Offset),
                ChallengeEnd = new DateTimeOffset(now.Year, 8, 31, 23, 59, 59, now.Offset)
            }
        });
    }
}