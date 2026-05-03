using System;
using System.Threading.Tasks;
using Jellyfin.Plugin.AchievementBadges.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Jellyfin.Plugin.AchievementBadges.Api;

/// <summary>
/// v1.8.59 (A+): writes an entry to the AuditLogService after every action
/// running under the "RequiresElevation" policy. Captures the actor's user
/// ID, the route + method, and whether the action succeeded. Designed for
/// incident response — "who unlocked badge X for user Y last Tuesday" is
/// answerable without needing to grep verbose runtime logs.
///
/// Registered as a class-level [ServiceFilter] alongside UserOwnershipFilter
/// on AchievementBadgesController. Runs as a no-op for routes that don't
/// carry the RequiresElevation policy, so the cost on user-only endpoints
/// is a single endpoint-metadata probe.
/// </summary>
public class AdminAuditLogFilter : IAsyncActionFilter
{
    private readonly AuditLogService _auditLog;

    public AdminAuditLogFilter(AuditLogService auditLog)
    {
        _auditLog = auditLog;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Only audit elevation-required routes — all 15 admin-only writes.
        // We probe endpoint metadata for an [Authorize(Policy="RequiresElevation")]
        // attribute rather than parsing the policy at request time so the
        // check stays decoupled from policy implementation details.
        var endpoint = context.HttpContext.GetEndpoint();
        var requiresElevation = false;
        if (endpoint != null)
        {
            foreach (var item in endpoint.Metadata)
            {
                if (item is AuthorizeAttribute aa && aa.Policy == "RequiresElevation")
                {
                    requiresElevation = true;
                    break;
                }
            }
        }

        if (!requiresElevation)
        {
            await next();
            return;
        }

        var actorId = context.HttpContext.User.FindFirst("Jellyfin-UserId")?.Value
                      ?? context.HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                      ?? "unknown";
        var actorName = context.HttpContext.User.Identity?.Name ?? "unknown";
        var method = context.HttpContext.Request.Method;
        var path = context.HttpContext.Request.Path.Value ?? string.Empty;

        ActionExecutedContext? executed = null;
        try
        {
            executed = await next();
        }
        finally
        {
            try
            {
                var statusCode = context.HttpContext.Response.StatusCode;
                var success = executed?.Exception == null && statusCode >= 200 && statusCode < 400;
                var details = $"{method} {path} -> {statusCode}";
                _auditLog.Log(actorId, actorName, success ? "admin.action" : "admin.action_failed", details);
            }
            catch
            {
                // Audit log failures are non-fatal — never let logging break the request.
            }
        }
    }
}
