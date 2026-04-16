using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Controller.Library;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Jellyfin.Plugin.AchievementBadges.Api;

[ApiController]
[Authorize]
[Route("Plugins/AchievementBadges")]
[ServiceFilter(typeof(UserOwnershipFilter))]
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
    private readonly IUserManager _userManager;
    private readonly IAuthorizationService _authService;
    private readonly FriendsService _friendsService;

    public AchievementBadgesController(
        AchievementBadgeService badgeService,
        PlaybackCompletionService playbackCompletionService,
        WatchHistoryBackfillService backfillService,
        LibraryCompletionService libraryCompletionService,
        RecapService recapService,
        RecommendationService recommendationService,
        QuestService questService,
        AuditLogService auditLog,
        IUserManager userManager,
        IAuthorizationService authService,
        FriendsService friendsService)
    {
        _badgeService = badgeService;
        _playbackCompletionService = playbackCompletionService;
        _backfillService = backfillService;
        _libraryCompletionService = libraryCompletionService;
        _recapService = recapService;
        _recommendationService = recommendationService;
        _questService = questService;
        _auditLog = auditLog;
        _userManager = userManager;
        _authService = authService;
        _friendsService = friendsService;
    }

    [HttpGet("test")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public ActionResult Test()
    {
        var debug = Plugin.Instance?.Configuration?.EnableDebugEndpoints ?? false;
        if (!debug)
        {
            // Don't leak patched path / host-filesystem diagnostics or exact
            // build version to unauthenticated callers unless debug endpoints
            // are explicitly enabled by the admin. Keeps plugin fingerprinting
            // out of anon attackers' hands.
            return Ok(new { Status = "Achievement Badges plugin working!" });
        }
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

        // Try JSON (e.g. translation files live under Pages/translations, but
        // clients can also fetch them via the flat client-script route).
        var jsonContent = ResourceReader.ReadEmbeddedText(
            "Jellyfin.Plugin.AchievementBadges.Pages." + name + ".json");
        if (jsonContent is not null)
        {
            return Content(jsonContent, "application/json");
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

    // ---------- i18n: translations -----------------------------------------
    [HttpGet("translations/{lang}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetTranslations([FromRoute] string lang)
    {
        // Sanitize lang to prevent path traversal (only letters + dash).
        var clean = new string((lang ?? "en").ToLowerInvariant()
            .Where(c => (c >= 'a' && c <= 'z') || c == '-').ToArray());
        if (string.IsNullOrEmpty(clean)) clean = "en";

        var content = ResourceReader.ReadEmbeddedText(
            "Jellyfin.Plugin.AchievementBadges.Pages.translations." + clean + ".json");
        if (content is null && clean != "en")
        {
            // Fall back to English if the requested language isn't bundled.
            content = ResourceReader.ReadEmbeddedText(
                "Jellyfin.Plugin.AchievementBadges.Pages.translations.en.json");
        }
        if (content is null) return NotFound();
        return Content(content, "application/json");
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
        limit = Math.Clamp(limit, 1, 50);

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
        limit = Math.Clamp(limit, 1, 20);

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
    [EnableRateLimiting("user-60-per-min")]
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
        if (double.IsNaN(completionPercent) || double.IsInfinity(completionPercent))
        {
            return BadRequest(new { Message = "completionPercent must be a finite number." });
        }
        completionPercent = Math.Clamp(completionPercent, 0d, 100d);

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

    // ---------- Friends --------------------------------------------

    [HttpGet("users/{userId}/friends")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetFriends([FromRoute] string userId)
    {
        return Ok(_friendsService.List(userId));
    }

    [HttpPost("users/{userId}/friends/{friendUserId}")]
    [EnableRateLimiting("user-60-per-min")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult SendFriendRequest([FromRoute] string userId, [FromRoute] string friendUserId)
    {
        var (ok, message) = _friendsService.SendRequest(userId, friendUserId);
        return Ok(new { Success = ok, Message = message });
    }

    [HttpPost("users/{userId}/friends/{friendUserId}/accept")]
    [EnableRateLimiting("user-60-per-min")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult AcceptFriendRequest([FromRoute] string userId, [FromRoute] string friendUserId)
    {
        var (ok, message) = _friendsService.Accept(userId, friendUserId);
        return Ok(new { Success = ok, Message = message });
    }

    [HttpDelete("users/{userId}/friends/{friendUserId}")]
    [EnableRateLimiting("user-60-per-min")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult RemoveFriend([FromRoute] string userId, [FromRoute] string friendUserId)
    {
        var (ok, message) = _friendsService.Remove(userId, friendUserId);
        return Ok(new { Success = ok, Message = message });
    }

    // Public read of another user's equipped badges. The route deliberately
    // uses {targetUserId} so the UserOwnershipFilter ignores it (the filter
    // only guards endpoints with a {userId} param). Still requires an
    // authenticated Jellyfin session. Returns a minimal Icon/Title/Rarity
    // projection so private fields never leak. Respects the target's privacy
    // prefs and the admin-level force-privacy / force-hide toggles.
    [HttpGet("profiles/{targetUserId}/equipped")]
    [EnableRateLimiting("ip-30-per-min")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetPublicEquipped([FromRoute] string targetUserId)
    {
        // Reject malformed / oversized ids before any service work — stops
        // the service-layer dictionary lookup acting as a timing side-channel
        // for userId probing.
        if (string.IsNullOrWhiteSpace(targetUserId) || targetUserId.Length > 64 || !Guid.TryParse(targetUserId, out _))
            return Ok(new List<object>());
        return Ok(_badgeService.GetPublicEquippedPreview(targetUserId));
    }

    [HttpPost("users/{userId}/equipped/{badgeId}")]
    [EnableRateLimiting("user-60-per-min")]
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
    [EnableRateLimiting("user-60-per-min")]
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
        limit = Math.Clamp(limit, 1, 200);
        var leaderboard = _badgeService.GetLeaderboard(limit);
        return Ok(leaderboard);
    }

    [HttpGet("badges/rarity-stats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetBadgeRarityStats()
    {
        // Cached 5 minutes by the service so this is cheap to call on
        // every achievements-page load.
        return Ok(_badgeService.GetBadgeRarityPercentages());
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
    public ActionResult GetBadgeCatalog([FromQuery] string? lang = null)
    {
        var config = Plugin.Instance?.Configuration;
        var disabled = new HashSet<string>(
            config?.DisabledBadgeIds ?? new List<string>(),
            StringComparer.OrdinalIgnoreCase);

        // Admin user's language — projected into the badge title/description
        // so the "Enable / disable badges" grid doesn't stay English for a
        // French admin. Client passes it via ?lang=fr (from the admin page's
        // localStorage 'achievementBadgesLang' key set by the standalone
        // language picker).
        var catalog = AchievementDefinitions.All
            .GroupBy(d => d.Category)
            .Select(g => new
            {
                Category = g.Key,
                Badges = g.Select(d =>
                {
                    var (localTitle, localDesc) = Helpers.BadgeLocalizer.Lookup(d.Id, lang);
                    return new
                    {
                        d.Id,
                        Title = localTitle ?? d.Title,
                        Description = localDesc ?? d.Description,
                        d.Icon,
                        d.Rarity,
                        d.TargetValue,
                        Disabled = disabled.Contains(d.Id)
                    };
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
    [EnableRateLimiting("recompute-cooldown")]
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
    [EnableRateLimiting("user-60-per-min")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async System.Threading.Tasks.Task<ActionResult> CompareUsers([FromRoute] string userIdA, [FromRoute] string userIdB)
    {
        // UserOwnershipFilter guards only on {userId} route tokens, so this
        // endpoint would otherwise accept any two attacker-controlled GUIDs.
        // Enforce here that the caller is either userIdA or userIdB (or admin)
        // before recording compare-history — otherwise an attacker can
        // pollute any other user's on-disk compare-history.
        var caller = User.FindFirst("Jellyfin-UserId")?.Value;
        bool callerMatchesA = false, callerMatchesB = false;
        if (!string.IsNullOrEmpty(caller) && Guid.TryParse(caller, out var callerGuid))
        {
            if (Guid.TryParse(userIdA, out var agA)) callerMatchesA = agA == callerGuid;
            if (Guid.TryParse(userIdB, out var agB)) callerMatchesB = agB == callerGuid;
        }

        var isAdmin = false;
        if (!callerMatchesA && !callerMatchesB)
        {
            var adminAuth = await _authService.AuthorizeAsync(User, null, "RequiresElevation");
            isAdmin = adminAuth.Succeeded;
        }

        if (!isAdmin && !callerMatchesA && !callerMatchesB)
        {
            return Forbid();
        }

        // Only record history for the caller's side — never touch the other
        // user's profile so a malicious call can't be used to flush / inject
        // entries into a victim's CompareHistory.
        if (callerMatchesA)
        {
            _badgeService.RecordCompareHistory(userIdA, userIdB);
        }
        else if (callerMatchesB)
        {
            _badgeService.RecordCompareHistory(userIdB, userIdA);
        }
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
        if (prefs is null) return BadRequest(new { Message = "Preferences payload required." });

        // Normalise and bound any free-form string / int fields so a crafted
        // payload can't bloat the on-disk profile with megabytes of attacker-
        // supplied data. (The ASP.NET request body limit still caps total
        // size, but these are the fields we actually round-trip into JSON.)
        var allowedLangs = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "default", "en", "fr", "es", "de", "it", "pt", "zh", "ja" };
        prefs.Language = string.IsNullOrWhiteSpace(prefs.Language) || !allowedLangs.Contains(prefs.Language)
            ? "default" : prefs.Language.ToLowerInvariant();

        var allowedThemes = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "default", "dark", "light" };
        prefs.AchievementPageTheme = string.IsNullOrWhiteSpace(prefs.AchievementPageTheme) || !allowedThemes.Contains(prefs.AchievementPageTheme)
            ? "default" : prefs.AchievementPageTheme.ToLowerInvariant();

        var allowedRarities = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "all", "rare", "epic", "legendary" };
        prefs.MinimumToastRarity = string.IsNullOrWhiteSpace(prefs.MinimumToastRarity) || !allowedRarities.Contains(prefs.MinimumToastRarity)
            ? "all" : prefs.MinimumToastRarity.ToLowerInvariant();

        prefs.EquippedBadgeSlots = Math.Clamp(prefs.EquippedBadgeSlots, 1, 10);

        _badgeService.SaveUserPreferences(userId, prefs);
        return Ok(new { Success = true });
    }

    [HttpGet("activity-feed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetActivityFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? userId = null)
    {
        var requestingUserId = User.FindFirst("Jellyfin-UserId")?.Value;
        return Ok(_badgeService.GetActivityFeed(page, pageSize, userId, requestingUserId));
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
        // Bound 'weeks' — callers request a rolling week window; allowing
        // arbitrarily large values invites quadratic calendar-build work.
        weeks = Math.Clamp(weeks, 1, 520);
        return Ok(_badgeService.GetStreakCalendar(userId, weeks));
    }

    [HttpGet("users/{userId}/badge-eta")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetBadgeEtas([FromRoute] string userId, [FromQuery] int limit = 50)
    {
        limit = Math.Clamp(limit, 1, 500);
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
        limit = Math.Clamp(limit, 1, 200);
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
    [EnableRateLimiting("user-60-per-min")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult PinBadge([FromRoute] string userId, [FromRoute] string badgeId, [FromBody] PinBadgeRequest? body)
    {
        return Ok(_badgeService.PinBadge(userId, badgeId, body?.Pinned ?? true));
    }

    public class EquipTitleRequest { public string? BadgeId { get; set; } }

    [HttpPost("users/{userId}/title")]
    [EnableRateLimiting("user-60-per-min")]
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
    [EnableRateLimiting("user-60-per-min")]
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
    [EnableRateLimiting("ip-30-per-min")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult GetProfileCard([FromRoute] string userId)
    {
        // Unified "unavailable" response for all failure modes so the caller
        // can't use 200 vs 404 to enumerate which Jellyfin user GUIDs exist
        // on the server. Respond with a generic HTML page for every failure.
        ContentResult Unavailable() => Content(
            "<html><body style='background:#111;color:#fff;font-family:sans-serif;padding:2em;'>" +
            "<h1>Profile card unavailable</h1><p>This profile could not be rendered right now.</p></body></html>",
            "text/html");

        if (!Guid.TryParse(userId, out var userGuid))
        {
            return Unavailable();
        }
        try
        {
            var userExists = _userManager.GetUserById(userGuid);
            if (userExists is null)
            {
                return Unavailable();
            }
        }
        catch
        {
            return Unavailable();
        }

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
                .Replace("{{userId}}", System.Net.WebUtility.HtmlEncode(userId))
                .Replace("{{score}}", score.ToString())
                .Replace("{{unlocked}}", unlocked.ToString())
                .Replace("{{total}}", total.ToString())
                .Replace("{{percentage}}", percentage.ToString("0.#"))
                .Replace("{{bestStreak}}", bestStreak.ToString())
                .Replace("{{currentStreak}}", currentStreak.ToString())
                .Replace("{{tierName}}", System.Net.WebUtility.HtmlEncode(tier.Name))
                .Replace("{{tierColor}}", System.Net.WebUtility.HtmlEncode(tier.Color))
                .Replace("{{progressToNext}}", progress.ToString())
                .Replace("{{nextTierLabel}}", System.Net.WebUtility.HtmlEncode(next is null ? "Max rank" : $"{next.MinScore - score} to {next.Name}"))
                .Replace("{{recapMovies}}", recapMovies.ToString())
                .Replace("{{recapEpisodes}}", recapEpisodes.ToString())
                .Replace("{{recapUnlocks}}", recapUnlocks.ToString())
                .Replace("{{equippedHtml}}", equippedHtml);
        }
        catch
        {
            // Don't leak internal exception messages to anonymous callers —
            // a malformed profile, missing dependency, or any other server-
            // side error becomes a generic "try again later" page.
            return Content(
                "<html><body style='background:#111;color:#fff;font-family:sans-serif;padding:2em;'>" +
                "<h1>Profile card unavailable</h1><p>This profile could not be rendered right now.</p></body></html>",
                "text/html");
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
        config.CustomBadges = (badges ?? new())
            .Where(b => !string.IsNullOrWhiteSpace(b.Id))
            .Select(AchievementDefinitionSanitizer.Sanitize)
            .ToList();
        foreach (var b in config.CustomBadges) { b.IsCustom = true; }
        plugin.UpdateConfiguration(config);
        return Ok(new { Count = config.CustomBadges.Count });
    }

    // ---------- Quests (admin) --------------------------------------

    public class AdminQuestsPayload
    {
        public List<QuestDefinition> CustomDailyQuests { get; set; } = new();
        public List<QuestDefinition> CustomWeeklyQuests { get; set; } = new();
        public List<string> DisabledQuestIds { get; set; } = new();
    }

    [HttpGet("admin/quests")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetAdminQuests()
    {
        var cfg = Plugin.Instance?.Configuration;
        // Ship both the raw admin config AND the built-in pool so the admin
        // UI can render both lists side-by-side with a single fetch.
        return Ok(new
        {
            BuiltInDaily = QuestService.DailyTemplates.Select(t => new
            {
                t.Id, t.Title, t.Description, Metric = t.Metric.ToString(), t.Target, t.Reward, t.Icon
            }).ToList(),
            BuiltInWeekly = QuestService.WeeklyTemplates.Select(t => new
            {
                t.Id, t.Title, t.Description, Metric = t.Metric.ToString(), t.Target, t.Reward, t.Icon
            }).ToList(),
            CustomDailyQuests = cfg?.CustomDailyQuests ?? new List<QuestDefinition>(),
            CustomWeeklyQuests = cfg?.CustomWeeklyQuests ?? new List<QuestDefinition>(),
            DisabledQuestIds = cfg?.DisabledQuestIds ?? new List<string>()
        });
    }

    [HttpPost("admin/quests")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult SaveAdminQuests([FromBody] AdminQuestsPayload payload)
    {
        if (payload == null) return BadRequest(new { Message = "Payload required." });
        var plugin = Plugin.Instance;
        if (plugin is null) return BadRequest();

        static QuestDefinition SanitiseQuest(QuestDefinition q)
        {
            // Bound all free-form fields so a malicious admin payload can't
            // bloat the on-disk config with megabytes of data.
            q.Id = (q.Id ?? string.Empty).Trim();
            if (q.Id.Length > 128) q.Id = q.Id.Substring(0, 128);
            q.Title = (q.Title ?? string.Empty).Trim();
            if (q.Title.Length > 200) q.Title = q.Title.Substring(0, 200);
            q.Description = (q.Description ?? string.Empty).Trim();
            if (q.Description.Length > 1000) q.Description = q.Description.Substring(0, 1000);
            q.Icon = string.IsNullOrWhiteSpace(q.Icon) ? "play_circle" : q.Icon.Trim();
            if (q.Icon.Length > 64) q.Icon = q.Icon.Substring(0, 64);
            q.Target = Math.Clamp(q.Target, 1, 1_000_000);
            q.Reward = Math.Clamp(q.Reward, 0, 100_000);
            return q;
        }

        var config = plugin.Configuration;
        // Cap list sizes to keep the config JSON from being weaponised.
        config.CustomDailyQuests = (payload.CustomDailyQuests ?? new())
            .Where(q => q != null && !string.IsNullOrWhiteSpace(q.Id) && !string.IsNullOrWhiteSpace(q.Title))
            .Select(SanitiseQuest)
            .Take(100)
            .ToList();
        config.CustomWeeklyQuests = (payload.CustomWeeklyQuests ?? new())
            .Where(q => q != null && !string.IsNullOrWhiteSpace(q.Id) && !string.IsNullOrWhiteSpace(q.Title))
            .Select(SanitiseQuest)
            .Take(100)
            .ToList();
        config.DisabledQuestIds = (payload.DisabledQuestIds ?? new())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Where(s => s.Length <= 128)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(200)
            .ToList();

        plugin.UpdateConfiguration(config);
        return Ok(new
        {
            Success = true,
            CustomDaily = config.CustomDailyQuests.Count,
            CustomWeekly = config.CustomWeeklyQuests.Count,
            Disabled = config.DisabledQuestIds.Count
        });
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
        config.Challenges = (challenges ?? new())
            .Where(b => !string.IsNullOrWhiteSpace(b.Id))
            .Select(AchievementDefinitionSanitizer.Sanitize)
            .ToList();
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

        if (request?.WebhookEnabled == true && !WebhookUrlValidator.TryValidate(request.WebhookUrl, out var error))
        {
            return BadRequest(new { Message = error });
        }

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
    [EnableRateLimiting("prestige-cooldown")]
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
    [EnableRateLimiting("user-60-per-min")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult BuyBadge([FromRoute] string userId, [FromRoute] string badgeId)
    {
        var result = _badgeService.SpendScoreForBadge(userId, badgeId);
        return Ok(result);
    }

    [HttpPost("users/{userId}/gift/{toUserId}")]
    [EnableRateLimiting("user-60-per-min")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GiftScore([FromRoute] string userId, [FromRoute] string toUserId, [FromQuery] int amount = 0)
    {
        // Validate the recipient before handing off — the service would
        // otherwise lazy-create a brand new on-disk profile for any arbitrary
        // string, letting a caller bloat the profiles JSON with garbage ids.
        if (!Guid.TryParse(toUserId, out var toGuid))
            return BadRequest(new { Message = "Invalid recipient id." });
        try
        {
            if (_userManager.GetUserById(toGuid) is null)
                return BadRequest(new { Message = "Recipient not found." });
        }
        catch
        {
            return BadRequest(new { Message = "Recipient not found." });
        }

        amount = Math.Clamp(amount, 1, 10_000);

        var result = _badgeService.GiftScore(userId, toUserId, amount);
        _auditLog?.Log(userId, User.Identity?.Name ?? string.Empty, "gift-score", "to " + toUserId + " amount=" + amount);
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
        if (profile != null && profile.Badges != null)
        {
            profile.Badges = profile.Badges
                .Where(b => b != null && !string.IsNullOrWhiteSpace(b.Id))
                .Select(AchievementDefinitionSanitizer.Sanitize)
                .ToList();
        }
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

    // ---------- Admin: Reset user progress ------------------------------

    [HttpDelete("admin/users/{userId}/reset")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult ResetUserProgress([FromRoute] string userId)
    {
        var removed = _badgeService.ResetUserProgress(userId);
        if (!removed)
        {
            return NotFound(new { Error = "User profile not found." });
        }

        return Ok(new { Success = true });
    }

    // ---------- Public: feature flags (non-sensitive, for the standalone page) ---

    [HttpGet("public-config")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetPublicConfig()
    {
        var c = Plugin.Instance?.Configuration;
        return Ok(new
        {
            WelcomeMessage = c?.WelcomeMessage ?? "",
            LeaderboardEnabled = c?.LeaderboardEnabled ?? true,
            CompareEnabled = c?.CompareEnabled ?? true,
            ActivityFeedEnabled = c?.ActivityFeedEnabled ?? true,
            PrestigeEnabled = c?.PrestigeEnabled ?? true,
            QuestsEnabled = c?.QuestsEnabled ?? true,
            ForcePrivacyMode = c?.ForcePrivacyMode ?? false,
            ForceSpoilerMode = c?.ForceSpoilerMode ?? false,
            ForceExtremeSpoilerMode = c?.ForceExtremeSpoilerMode ?? false,
            DefaultLanguage = c?.DefaultLanguage ?? "en",
            CustomXboxLogoSvg = c?.CustomXboxLogoSvg ?? "",
            ForceHideEquippedShowcase = c?.ForceHideEquippedShowcase ?? false
        });
    }

    // ---------- Admin: Feature config -----------------------------------

    [HttpGet("admin/feature-config")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetFeatureConfig()
    {
        var c = Plugin.Instance?.Configuration;
        return Ok(new
        {
            LeaderboardEnabled = c?.LeaderboardEnabled ?? true,
            CompareEnabled = c?.CompareEnabled ?? true,
            ActivityFeedEnabled = c?.ActivityFeedEnabled ?? true,
            PrestigeEnabled = c?.PrestigeEnabled ?? true,
            QuestsEnabled = c?.QuestsEnabled ?? true,
            ForcePrivacyMode = c?.ForcePrivacyMode ?? false,
            ForceSpoilerMode = c?.ForceSpoilerMode ?? false,
            ForceExtremeSpoilerMode = c?.ForceExtremeSpoilerMode ?? false,
            MaxEquippedBadges = c?.MaxEquippedBadges ?? 5,
            RestrictBadgeVisibility = c?.RestrictBadgeVisibility ?? false,
            DisabledBadgeCategories = c?.DisabledBadgeCategories ?? new List<string>(),
            WelcomeMessage = c?.WelcomeMessage ?? "",
            DefaultLanguage = c?.DefaultLanguage ?? "en",
            CustomXboxLogoSvg = c?.CustomXboxLogoSvg ?? "",
            RedactUsernamesInAuditLog = c?.RedactUsernamesInAuditLog ?? false,
            ForceHideEquippedShowcase = c?.ForceHideEquippedShowcase ?? false
        });
    }

    public class FeatureConfigRequest
    {
        public bool LeaderboardEnabled { get; set; } = true;
        public bool CompareEnabled { get; set; } = true;
        public bool ActivityFeedEnabled { get; set; } = true;
        public bool PrestigeEnabled { get; set; } = true;
        public bool QuestsEnabled { get; set; } = true;
        public bool ForcePrivacyMode { get; set; } = false;
        public bool ForceSpoilerMode { get; set; } = false;
        public bool ForceExtremeSpoilerMode { get; set; } = false;
        public int MaxEquippedBadges { get; set; } = 5;
        public bool RestrictBadgeVisibility { get; set; } = false;
        public List<string> DisabledBadgeCategories { get; set; } = new();
        public string WelcomeMessage { get; set; } = "";
        public string DefaultLanguage { get; set; } = "en";
        public string CustomXboxLogoSvg { get; set; } = "";
        public bool RedactUsernamesInAuditLog { get; set; } = false;
        public bool ForceHideEquippedShowcase { get; set; } = false;
    }

    [HttpPost("admin/feature-config")]
    [Authorize(Policy = "RequiresElevation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult SaveFeatureConfig([FromBody] FeatureConfigRequest request)
    {
        var plugin = Plugin.Instance;
        if (plugin is null) return BadRequest();
        var config = plugin.Configuration;
        config.LeaderboardEnabled = request.LeaderboardEnabled;
        config.CompareEnabled = request.CompareEnabled;
        config.ActivityFeedEnabled = request.ActivityFeedEnabled;
        config.PrestigeEnabled = request.PrestigeEnabled;
        config.QuestsEnabled = request.QuestsEnabled;
        config.ForcePrivacyMode = request.ForcePrivacyMode;
        config.ForceSpoilerMode = request.ForceSpoilerMode;
        config.ForceExtremeSpoilerMode = request.ForceExtremeSpoilerMode;
        config.MaxEquippedBadges = Math.Clamp(request.MaxEquippedBadges, 1, 10);
        config.RestrictBadgeVisibility = request.RestrictBadgeVisibility;
        config.DisabledBadgeCategories = request.DisabledBadgeCategories ?? new();
        config.WelcomeMessage = request.WelcomeMessage ?? "";
        // Only accept known language codes; default to "en".
        var lang = (request.DefaultLanguage ?? "en").ToLowerInvariant();
        var allowedLangs = new HashSet<string> { "en", "fr", "es", "de", "it", "pt", "zh", "ja" };
        if (!allowedLangs.Contains(lang)) lang = "en";
        config.DefaultLanguage = lang;

        // Custom Xbox logo SVG — sanitize before storing. We accept either a
        // raw SVG string or a base64-encoded one; store base64 so the frontend
        // can stuff it into an <img src="data:image/svg+xml;base64,..."> tag.
        var (encodedSvg, svgError) = SanitizeAndEncodeSvgWithReason(request.CustomXboxLogoSvg ?? "");
        config.CustomXboxLogoSvg = encodedSvg;

        config.RedactUsernamesInAuditLog = request.RedactUsernamesInAuditLog;
        config.ForceHideEquippedShowcase = request.ForceHideEquippedShowcase;

        // Surface the specific sanitizer error so the admin knows what to
        // fix instead of seeing a generic "rejected" message.
        var rawSvg = request.CustomXboxLogoSvg ?? "";
        var svgWarning = "";
        if (!string.IsNullOrWhiteSpace(rawSvg) && string.IsNullOrEmpty(encodedSvg))
        {
            svgWarning = string.IsNullOrWhiteSpace(svgError)
                ? "The uploaded Xbox logo SVG was rejected. The default logo is still being used."
                : "SVG rejected: " + svgError + " The default logo is still being used.";
        }

        plugin.UpdateConfiguration(config);
        return Ok(new { Success = true, SvgWarning = svgWarning });
    }

    private static string SanitizeAndEncodeSvg(string input)
    {
        var (encoded, _) = SanitizeAndEncodeSvgWithReason(input);
        return encoded;
    }

    private static (string encoded, string? error) SanitizeAndEncodeSvgWithReason(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return ("", null);
        var trimmed = input.Trim();
        // Cap the length to prevent config-file blow-up.
        if (trimmed.Length > 131072) trimmed = trimmed.Substring(0, 131072);

        string svg;
        // If the input contains an '<' character it is almost certainly raw
        // SVG/XML markup (base64 never contains '<'). Short-circuit the base64
        // branch so we don't accidentally get partial decodes of SVGs that
        // happen to start with base64-legal chars.
        if (trimmed.Contains('<'))
        {
            svg = trimmed;
        }
        else
        {
            // Try base64 decode — if it's already base64, we still want to
            // sanitize the decoded SVG, then re-encode.
            try
            {
                var decoded = System.Text.Encoding.UTF8.GetString(System.Convert.FromBase64String(trimmed));
                if (decoded.Contains("<svg", System.StringComparison.OrdinalIgnoreCase))
                {
                    svg = decoded;
                }
                else
                {
                    svg = trimmed;
                }
            }
            catch
            {
                svg = trimmed;
            }
        }

        // Validate via the XML-parsing sanitizer (more robust than regex).
        if (!Helpers.SvgSanitizer.TryValidate(svg, out var svgErr))
        {
            return ("", svgErr);
        }

        return (System.Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(svg)), null);
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