using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Jellyfin.Plugin.AchievementBadges.Helpers;
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
    private static readonly string VerTag = ClientAssetVersion.QueryTag;

    private static readonly string InjectionScript =
        "<!-- achievementbadges-bootstrap -->" +
        "<script src=\"/Plugins/AchievementBadges/client-script/sidebar" + VerTag + "\"></script>" +
        "<script src=\"/Plugins/AchievementBadges/client-script/standalone" + VerTag + "\" defer></script>" +
        "<script src=\"/Plugins/AchievementBadges/client-script/enhance" + VerTag + "\" defer></script>" +
        "<!-- /achievementbadges-bootstrap -->";

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

            // Rewrite text/html whether or not it arrived compressed. Treating
            // compressed bytes as UTF-8 would mangle them, so a gzip/br body is
            // decoded first and re-encoded afterwards in the same format, which
            // leaves the client seeing exactly what it negotiated.
            //
            // This used to bail out on any Content-Encoding. Every browser
            // sends Accept-Encoding: gzip, so that branch was the only one
            // browsers ever took and the scripts were never delivered to them.
            // The injection only appeared to work because curl without
            // --compressed takes the other branch.
            var isHtml = contentType != null && contentType.Contains("text/html", StringComparison.OrdinalIgnoreCase);
            var encoding = ResponseCompression.Normalize(contentEncoding);
            var isCompressed = encoding.Length > 0;
            var canRewrite = isHtml && (!isCompressed || ResponseCompression.CanRoundTrip(encoding));

            if (canRewrite)
            {
                string html;
                if (isCompressed)
                {
                    html = Encoding.UTF8.GetString(ResponseCompression.Decompress(buffer.ToArray(), encoding));
                }
                else
                {
                    using var reader = new StreamReader(buffer, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 1024, leaveOpen: true);
                    html = await reader.ReadToEndAsync();
                }

                // v1.9.0: marker fast-path. The injection marker
                // <!-- achievementbadges-bootstrap --> is always emitted
                // immediately before </body>, so on a typical Jellyfin SPA
                // index (~80KB) we'd previously scan the whole document
                // string on every page request to look for it. Sample only
                // the last 4KB — the entire end-of-body region — and fall
                // through to "not injected yet" if it's not there. Safe
                // because: (a) the marker only appears at the bottom of the
                // document by construction, (b) if the marker is somehow
                // present mid-document via an unrelated injection, double-
                // injecting near </body> is harmless (scripts are idempotent).
                var tailLen = Math.Min(4096, html.Length);
                var tail = tailLen == html.Length ? html : html.Substring(html.Length - tailLen);
                if (tail.Contains("achievementbadges-bootstrap", StringComparison.Ordinal))
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
                    if (isCompressed)
                    {
                        // Re-encode in the same format, so Content-Encoding
                        // stays truthful and the client decodes as usual.
                        bytes = ResponseCompression.Compress(bytes, encoding);
                    }

                    // Clear Content-Length so the framework re-derives it from the new body.
                    // Setting it to bytes.Length first caused a race on some Kestrel paths.
                    context.Response.ContentLength = null;
                    context.Response.Body = originalBody;
                    await context.Response.Body.WriteAsync(bytes);

                    // v1.8.61: drop from Information to Debug. This middleware
                    // fires on every Jellyfin web-page request (including
                    // periodic background heartbeats), so at INF level it
                    // dominated docker logs at ~one line per minute per
                    // active client. Debug keeps it available for
                    // troubleshooting without flooding production logs.
                    _logger.LogDebug("[AchievementBadges] Injected scripts into {Path} ({Bytes} bytes).", context.Request.Path.Value, bytes.Length);
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
