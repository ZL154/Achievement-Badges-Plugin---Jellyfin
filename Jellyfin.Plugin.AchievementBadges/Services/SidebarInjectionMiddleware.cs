using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class SidebarInjectionMiddleware
{
    private const long MaxBufferBytes = 5 * 1024 * 1024;

    private readonly RequestDelegate _next;
    private readonly ILogger<SidebarInjectionMiddleware> _logger;

    // Marker + three external scripts. Keep in sync with WebInjectionService.ScriptBlock.
    // sidebar.js handles nav injection AND equipped-showcase gating (respects
    // admin ForceHideEquippedShowcase + per-user ShowEquippedShowcase).
    // Previously this middleware shipped a bloated inline script that created
    // the showcase UI unconditionally, which ignored both flags — the disk
    // patch (WebInjectionService) was correctly gated but middleware-only
    // installs saw header dots / sidebar pills even when disabled.
    private const string InjectionScript =
        "<!-- achievementbadges-bootstrap -->" +
        "<script src=\"/Plugins/AchievementBadges/client-script/sidebar\"></script>" +
        "<script src=\"/Plugins/AchievementBadges/client-script/standalone\" defer></script>" +
        "<script src=\"/Plugins/AchievementBadges/client-script/enhance\" defer></script>";

    public SidebarInjectionMiddleware(RequestDelegate next, ILogger<SidebarInjectionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!CouldBeHtmlRequest(context))
        {
            await _next(context);
            return;
        }

        var originalBody = context.Response.Body;

        try
        {
            using var buffer = new MemoryStream();
            context.Response.Body = buffer;

            await _next(context);

            if (buffer.Length > MaxBufferBytes)
            {
                buffer.Seek(0, SeekOrigin.Begin);
                context.Response.Body = originalBody;
                await buffer.CopyToAsync(originalBody);
                return;
            }

            buffer.Seek(0, SeekOrigin.Begin);

            var contentType = context.Response.ContentType;
            var contentEncoding = context.Response.Headers["Content-Encoding"].ToString();

            // Only rewrite uncompressed text/html. If the response is gzip/br,
            // streaming through our buffer as plain UTF-8 would mangle bytes,
            // so pass it through untouched.
            var isHtml = contentType != null && contentType.Contains("text/html", StringComparison.OrdinalIgnoreCase);
            var isCompressed = !string.IsNullOrEmpty(contentEncoding);

            if (isHtml && !isCompressed)
            {
                using var reader = new StreamReader(buffer, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 1024, leaveOpen: true);
                var html = await reader.ReadToEndAsync();

                // Idempotency: if WebInjectionService has already patched
                // index.html on disk, the marker is present and we must not
                // inject again, otherwise we'd load the scripts twice.
                if (html.Contains("achievementbadges-bootstrap", StringComparison.Ordinal))
                {
                    buffer.Seek(0, SeekOrigin.Begin);
                    context.Response.Body = originalBody;
                    await buffer.CopyToAsync(originalBody);
                    return;
                }

                if (html.Contains("</body>", StringComparison.OrdinalIgnoreCase))
                {
                    html = html.Replace("</body>", InjectionScript + "</body>",
                        StringComparison.OrdinalIgnoreCase);

                    var bytes = Encoding.UTF8.GetBytes(html);
                    // Clear Content-Length so the framework re-derives it from the new body.
                    // Setting it to bytes.Length first caused a race on some Kestrel paths.
                    context.Response.ContentLength = null;
                    context.Response.Body = originalBody;
                    await context.Response.Body.WriteAsync(bytes);

                    _logger.LogInformation("[AchievementBadges] Injected scripts into {Path} ({Bytes} bytes).", context.Request.Path.Value, bytes.Length);
                    return;
                }
            }

            buffer.Seek(0, SeekOrigin.Begin);
            context.Response.Body = originalBody;
            await buffer.CopyToAsync(originalBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AchievementBadges] Error in script injection middleware.");
            // Best-effort: restore body + replay whatever the pipeline already
            // wrote, so the client gets the framework's response instead of
            // a silently blank page that could mask auth failures.
            try
            {
                context.Response.Body = originalBody;
            }
            catch { /* nothing we can do */ }
        }
    }

    // Broad prefilter: buffer anything that MIGHT be Jellyfin's SPA shell HTML.
    // Jellyfin serves index.html at /web/, /web, /web/index.html, and sometimes /.
    // We can't rely on the literal "index.html" substring — /web/ has no filename.
    // Content-Type gating inside InvokeAsync stops us actually rewriting non-HTML.
    private static bool CouldBeHtmlRequest(HttpContext context)
    {
        if (!context.Request.Method.Equals("GET", StringComparison.OrdinalIgnoreCase))
            return false;
        var path = context.Request.Path.Value;
        if (path == null) return false;

        // Skip obviously non-HTML paths to avoid buffering every asset in memory.
        if (path.Contains("/api/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Plugins/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/emby/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Items/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Users/", StringComparison.OrdinalIgnoreCase)
            && !path.EndsWith("/Users", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/socket", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/System/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Videos/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Audio/", StringComparison.OrdinalIgnoreCase)) return false;
        if (path.Contains("/Images/", StringComparison.OrdinalIgnoreCase)) return false;

        // Obvious static asset extensions — let them pass untouched.
        var lastSlash = path.LastIndexOf('/');
        var fileName = lastSlash >= 0 ? path.Substring(lastSlash + 1) : path;
        var dot = fileName.LastIndexOf('.');
        if (dot >= 0)
        {
            var ext = fileName.Substring(dot + 1).ToLowerInvariant();
            switch (ext)
            {
                case "js":
                case "mjs":
                case "css":
                case "map":
                case "png":
                case "jpg":
                case "jpeg":
                case "gif":
                case "svg":
                case "webp":
                case "ico":
                case "woff":
                case "woff2":
                case "ttf":
                case "eot":
                case "mp4":
                case "webm":
                case "m4s":
                case "ts":
                case "json":
                case "xml":
                case "txt":
                case "wasm":
                    return false;
            }
        }
        return true;
    }
}
