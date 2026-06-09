using System;
using System.Collections.Generic;
using System.Security.Claims;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.AchievementBadges.Api;

/// <summary>
/// [v2.1.0 "Open Library" M4] CRUD endpoints for admin-defined custom
/// badges. All endpoints require admin elevation (RequiresElevation
/// policy) — non-admin users can see custom badges they've earned in
/// their normal profile responses, but only admins author them.
///
/// Icon-upload endpoint is M7 polish. M4 ships URL-only icons (admin
/// pastes a URL; future upload writes to {pluginData}/custom-icons/).
/// </summary>
[ApiController]
[Authorize(Policy = "RequiresElevation")]
[Route("Plugins/AchievementBadges/custom-badges")]
public class CustomBadgesController : ControllerBase
{
    private readonly CustomBadgeService _customBadges;
    private readonly AuditLogService _auditLog;

    public CustomBadgesController(CustomBadgeService customBadges, AuditLogService auditLog)
    {
        _customBadges = customBadges;
        _auditLog = auditLog;
    }

    [HttpGet]
    public ActionResult<IReadOnlyList<CustomBadge>> List()
    {
        return Ok(_customBadges.GetAll());
    }

    [HttpGet("{id}")]
    public ActionResult<CustomBadge> Get(string id)
    {
        var badge = _customBadges.Get(id);
        return badge is null ? NotFound() : Ok(badge);
    }

    [HttpPost]
    public ActionResult<CustomBadge> Create([FromBody] CustomBadge badge)
    {
        if (badge is null) return BadRequest(new { error = "Body required." });
        try
        {
            badge.CreatedBy = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            badge.CreatedAt = DateTimeOffset.UtcNow;
            badge.Id = Guid.NewGuid().ToString("N");
            var saved = _customBadges.Upsert(badge);
            _auditLog.Log(badge.CreatedBy, badge.CreatedBy, "custom_badge_created",
                System.Text.Json.JsonSerializer.Serialize(new
                {
                    badgeId = saved.Id,
                    badgeName = saved.Name,
                    rarity = saved.Rarity,
                    media = saved.Media.ToString(),
                }));
            return CreatedAtAction(nameof(Get), new { id = saved.Id }, saved);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public ActionResult<CustomBadge> Update(string id, [FromBody] CustomBadge badge)
    {
        if (badge is null) return BadRequest(new { error = "Body required." });
        if (string.IsNullOrEmpty(id) || _customBadges.Get(id) is null) return NotFound();
        try
        {
            badge.Id = id;
            var saved = _customBadges.Upsert(badge);
            var editor = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            _auditLog.Log(editor, editor, "custom_badge_updated",
                System.Text.Json.JsonSerializer.Serialize(new
                {
                    badgeId = saved.Id,
                    badgeName = saved.Name,
                    rarity = saved.Rarity,
                    media = saved.Media.ToString(),
                }));
            return Ok(saved);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public ActionResult Delete(string id)
    {
        var badge = _customBadges.Get(id);
        if (badge is null) return NotFound();
        var ok = _customBadges.Delete(id);
        if (!ok) return NotFound();
        var deleter = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        _auditLog.Log(deleter, deleter, "custom_badge_deleted",
            System.Text.Json.JsonSerializer.Serialize(new
            {
                badgeId = id,
                badgeName = badge.Name,
            }));
        return NoContent();
    }

    [HttpGet("export")]
    public ActionResult<IReadOnlyList<CustomBadge>> Export()
    {
        return Ok(_customBadges.GetAll());
    }

    [HttpPost("import")]
    public ActionResult<IReadOnlyList<CustomBadge>> Import([FromBody] List<CustomBadge> badges)
    {
        if (badges is null || badges.Count == 0) return BadRequest(new { error = "Empty import." });
        var importer = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        var imported = new List<CustomBadge>();
        foreach (var b in badges)
        {
            try
            {
                b.Id = Guid.NewGuid().ToString("N");
                b.CreatedBy = importer;
                b.CreatedAt = DateTimeOffset.UtcNow;
                imported.Add(_customBadges.Upsert(b));
            }
            catch (Exception)
            {
                // Skip invalid; admin sees the count and can re-export.
            }
        }
        _auditLog.Log(importer, importer, "custom_badge_imported",
            System.Text.Json.JsonSerializer.Serialize(new { count = imported.Count }));
        return Ok(imported);
    }
}
