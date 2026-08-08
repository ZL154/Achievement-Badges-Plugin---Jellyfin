using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.AchievementBadges.Api;

/// <summary>
/// [v2.1.0 "Open Library" M6, issue #27] Admin endpoints for the
/// time-windowed badge audit + cleanup workflow. Both require admin
/// elevation.
/// </summary>
[ApiController]
[Authorize(Policy = "RequiresElevation")]
[Route("Plugins/AchievementBadges/time-windowed")]
// Admin JSON must never be cached (see AchievementBadgesController).
[ResponseCache(NoStore = true)]
public class TimeWindowedAdminController : ControllerBase
{
    private readonly TimeWindowedRecomputeService _recompute;
    private readonly AuditLogService _auditLog;

    public TimeWindowedAdminController(TimeWindowedRecomputeService recompute, AuditLogService auditLog)
    {
        _recompute = recompute;
        _auditLog = auditLog;
    }

    /// <summary>Generate an audit report of badges suspected to be
    /// wrongly awarded by pre-v2.1.0 backfill. Read-only.</summary>
    [HttpGet("audit")]
    public ActionResult<AuditCleanupReport> Audit()
    {
        return Ok(_recompute.Audit());
    }

    /// <summary>Clean up specified suspicious unlocks. Body is a list
    /// of {BadgeId, UserId} pairs from the audit report.</summary>
    [HttpPost("cleanup")]
    public ActionResult<object> Cleanup([FromBody] List<CleanupTarget>? targets)
    {
        if (targets is null || targets.Count == 0) return BadRequest(new { error = "Empty cleanup request." });
        var actor = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        var pairs = targets.Select(t => (t.BadgeId, t.UserId)).ToList();
        var cleared = _recompute.Cleanup(pairs);
        _auditLog.Log(actor, actor, "time_windowed_cleanup",
            System.Text.Json.JsonSerializer.Serialize(new { requested = targets.Count, cleared }));
        return Ok(new { requested = targets.Count, cleared });
    }

    public class CleanupTarget
    {
        public string BadgeId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }
}
