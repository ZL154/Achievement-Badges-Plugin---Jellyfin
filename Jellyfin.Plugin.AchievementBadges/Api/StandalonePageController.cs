using System.Net.Mime;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.AchievementBadges.Api;

/// <summary>
/// [v2.1] Standalone shell page for the achievements UI — renders ONLY the
/// AB page fragment + the existing <c>standalone.js</c> bundle, with no
/// Jellyfin sidebar / top bar / chrome around it. The caller passes the
/// access token, user id, and (optionally) server id as query string
/// parameters; the page seeds the <c>jellyfin_credentials</c> localStorage
/// entry the bundle's credential resolver already looks for, matching the
/// StarTrack pattern.
///
/// SECURITY: access token in the URL is logged by reverse proxies, kept in
/// browser history, and exposed in the Referer header for any outbound
/// links from this page. Only use the permalink mechanism for scopes where
/// that exposure is acceptable (e.g. a self-shared badge URL the user
/// generates and revokes themselves). This endpoint is anonymous; the
/// security gate is the token itself.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("Plugins/AchievementBadges")]
public class StandalonePageController : ControllerBase
{
    [HttpGet("StandalonePage")]
    [Produces(MediaTypeNames.Text.Html)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStandalonePage(
        [FromQuery] string? token,
        [FromQuery] string? userId,
        [FromQuery] string? serverId)
    {
        await Task.CompletedTask.ConfigureAwait(false);

        // Strip everything that could break out of the single-quoted JS
        // string literal we interpolate the value into below: quotes,
        // backslashes, line breaks, and ASCII control characters. The
        // remaining whitelist (printable non-control, no quotes / no
        // backslashes) cannot escape the string context.
        static string SafeJs(string? s)
        {
            if (string.IsNullOrEmpty(s)) return string.Empty;
            var sb = new System.Text.StringBuilder(s.Length + 8);
            foreach (var ch in s)
            {
                if (ch == '\\' || ch == '\'' || ch == '"' || ch == '\n' || ch == '\r' || ch < 32) continue;
                sb.Append(ch);
            }
            return sb.ToString();
        }

        var safeToken = SafeJs(token);
        var safeUserId = SafeJs(userId);
        var safeServerId = string.IsNullOrEmpty(serverId) ? "ab-standalone" : SafeJs(serverId);
        var origin = $"{Request.Scheme}://{Request.Host}";

        // SECURITY hardening for the token-in-URL pattern: refuse to leak
        // the URL to any outbound link's Referer header, and refuse to
        // cache the page in any shared proxy / browser cache. Without
        // these, a revoked token could continue to surface from caches
        // and Referer trails long after the user thought they killed it.
        Response.Headers["Referrer-Policy"] = "no-referrer";
        Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
        Response.Headers["Pragma"] = "no-cache";
        Response.Headers["Expires"] = "0";

        // The HTML loads ONLY the AB page fragment + the standalone.js
        // bundle. No Jellyfin shell, no sidebar, no top bar.
        var html = $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""utf-8"">
  <meta name=""viewport"" content=""width=device-width,initial-scale=1"">
  <title>Achievements</title>
  <style>
    html,body{{margin:0;background:#0f1115;color:#fff;font-family:-apple-system,Segoe UI,Roboto,sans-serif;}}
  </style>
  <script>
    // Seed the localStorage the standalone bundle expects, the same way
    // StarTrack does. The widget's existing credential resolver picks
    // this up automatically.
    window.ApiClient = window.ApiClient || {{}};
    try {{
      localStorage.setItem('jellyfin_credentials', JSON.stringify({{
        Servers: [{{
          Id: '{safeServerId}',
          AccessToken: '{safeToken}',
          UserId: '{safeUserId}',
          ManualAddress: '{origin}'
        }}]
      }}));
    }} catch (e) {{}}
  </script>
</head>
<body>
  <div id=""achievement-root""></div>
  <script src=""{origin}/Plugins/AchievementBadges/client-script/standalone.js""></script>
</body>
</html>";

        return Content(html, "text/html");
    }
}
