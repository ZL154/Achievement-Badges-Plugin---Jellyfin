using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// Patches Jellyfin's index.html on disk at startup so our sidebar / toast
/// scripts are baked into the HTML file every client loads — including
/// clients like the Jellyfin mobile apps that pre-fetch or cache index.html
/// in ways that bypass the SidebarInjectionMiddleware runtime rewrite.
/// SidebarInjectionMiddleware stays registered as a fallback for any
/// deployment where the web directory isn't writable.
/// </summary>
public class WebInjectionService : IHostedService
{
    // Open/close markers used to surgically strip old patches before
    // re-injecting the current version's block. Versioning the end marker
    // means pre-v1.7.3 installs (which didn't have an end marker and had
    // the OLD ungated inline showcase script) can be detected + cleaned up.
    private const string MarkerStart = "<!-- achievementbadges-bootstrap -->";
    private const string MarkerEnd = "<!-- /achievementbadges-bootstrap -->";

    // Three script tags, served by AchievementBadgesController's
    // client-script/{name} endpoint. sidebar.js handles nav injection,
    // standalone.js is the achievements page shell, enhance.js is the
    // toast + polling loop. Wrapped in versioned start/end markers so we
    // can safely strip and replace on subsequent plugin upgrades.
    private const string ScriptBlock =
        MarkerStart +
        "<script src=\"/Plugins/AchievementBadges/client-script/sidebar\"></script>" +
        "<script src=\"/Plugins/AchievementBadges/client-script/standalone\" defer></script>" +
        "<script src=\"/Plugins/AchievementBadges/client-script/enhance\" defer></script>" +
        MarkerEnd;

    // Embedded plugin-version stamp. When it changes across upgrades we
    // strip+re-inject so old, buggy versions of the inline scripts get
    // replaced instead of living forever next to the new ones.
    private static readonly string CurrentStamp =
        "<!-- ab-v" + (typeof(WebInjectionService).Assembly.GetName().Version?.ToString() ?? "0") + " -->";

    // Diagnostics for the test endpoint
    public static string DiagWebPath = "not set";
    public static bool DiagIndexFound;
    public static bool DiagIndexPatched;
    public static string DiagPatchedPath = "none";
    public static string DiagLastError = "none";

    private readonly IApplicationPaths _appPaths;
    private readonly ILogger<WebInjectionService> _logger;

    public WebInjectionService(IApplicationPaths appPaths, ILogger<WebInjectionService> logger)
    {
        _appPaths = appPaths;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        DiagWebPath = _appPaths.WebPath ?? "null";
        _logger.LogInformation("[AchievementBadges] WebInjectionService starting. WebPath={P}", _appPaths.WebPath);
        await TryPatchIndexHtmlAsync().ConfigureAwait(false);

        // Retry once after a short delay in case the web directory isn't
        // fully materialised at first boot on some setups.
        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(5000, cancellationToken).ConfigureAwait(false);
                await TryPatchIndexHtmlAsync().ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "[AchievementBadges] Retry patch attempt failed.");
            }
        }, cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    /// <summary>
    /// Remove every previous plugin-injected block from the patched HTML so
    /// we can re-inject cleanly. Handles three shapes seen in the wild:
    ///  1. pre-v1.7.3 with only the start marker + inline `&lt;script&gt;...`
    ///     followed by the three external script tags, no end marker.
    ///  2. v1.7.0-v1.7.2 with just the start marker + three external tags.
    ///  3. v1.7.3+ with start + end markers (cleanly delimited).
    /// </summary>
    private static string StripOldInjections(string html)
    {
        // Easy case: versioned start/end markers — strip everything between.
        while (true)
        {
            var startIdx = html.IndexOf(MarkerStart, StringComparison.Ordinal);
            if (startIdx < 0) break;
            var endIdx = html.IndexOf(MarkerEnd, startIdx, StringComparison.Ordinal);
            if (endIdx >= 0)
            {
                html = html.Remove(startIdx, (endIdx + MarkerEnd.Length) - startIdx);
                continue;
            }
            // Fallback: no end marker — strip from the marker to whichever
            // comes first of these sentinels. enhance.js was always loaded
            // last so its closing </script> is the conservative end of the
            // injected block. Cap the scan at 200KB to avoid pathological
            // cases.
            var scanLimit = Math.Min(html.Length, startIdx + 200_000);
            var enhanceIdx = html.IndexOf("client-script/enhance", startIdx, scanLimit - startIdx, StringComparison.Ordinal);
            if (enhanceIdx < 0)
            {
                // No enhance script found after the start marker — we don't
                // know where the old block ended. Just remove the marker
                // comment so the file no longer advertises a patched state,
                // and bail so we don't accidentally delete user content.
                html = html.Remove(startIdx, MarkerStart.Length);
                break;
            }
            var closeScript = html.IndexOf("</script>", enhanceIdx, StringComparison.OrdinalIgnoreCase);
            if (closeScript < 0) break;
            html = html.Remove(startIdx, (closeScript + "</script>".Length) - startIdx);
        }

        // Clean up any straggling version stamps from prior patches.
        var stampRegex = new System.Text.RegularExpressions.Regex("<!-- ab-v[0-9A-Za-z.\\-+]+ -->");
        html = stampRegex.Replace(html, string.Empty);

        return html;
    }

    private async Task TryPatchIndexHtmlAsync()
    {
        var candidates = new[]
        {
            Path.Combine(_appPaths.WebPath ?? string.Empty, "index.html"),
            "/usr/share/jellyfin/web/index.html",
            "/usr/lib/jellyfin/web/index.html",
            "/jellyfin/jellyfin-web/index.html",
            "/var/lib/jellyfin/web/index.html"
        };

        foreach (var path in candidates)
        {
            if (string.IsNullOrEmpty(path)) continue;
            try
            {
                if (!File.Exists(path)) continue;

                DiagIndexFound = true;
                var html = await File.ReadAllTextAsync(path).ConfigureAwait(false);

                // Already patched AT THIS VERSION? Idempotent no-op.
                if (html.Contains(CurrentStamp, StringComparison.Ordinal))
                {
                    DiagIndexPatched = true;
                    DiagPatchedPath = path;
                    _logger.LogInformation("[AchievementBadges] index.html already patched at current version at {P}", path);
                    return;
                }

                // Strip ALL previous achievementbadges-bootstrap injections
                // before adding the new one. Pre-v1.7.3 versions injected a
                // bloated inline script that ignored the equipped-showcase
                // prefs — if we don't strip it, upgrading the plugin would
                // leave the old buggy block running alongside the new one.
                html = StripOldInjections(html);

                if (!html.Contains("</body>", StringComparison.OrdinalIgnoreCase)) continue;

                var patched = html.Replace("</body>", CurrentStamp + ScriptBlock + "</body>", StringComparison.OrdinalIgnoreCase);

                var tmp = path + ".ab.tmp";
                await File.WriteAllTextAsync(tmp, patched).ConfigureAwait(false);
                File.Move(tmp, path, overwrite: true);

                DiagIndexPatched = true;
                DiagPatchedPath = path;
                _logger.LogInformation("[AchievementBadges] Patched index.html at {P}", path);
                return;
            }
            catch (UnauthorizedAccessException uex)
            {
                DiagLastError = $"Unauthorized: {path} - {uex.Message}";
                _logger.LogWarning("[AchievementBadges] Can't write {P}: {M}", path, uex.Message);
            }
            catch (Exception ex)
            {
                DiagLastError = $"{path} - {ex.Message}";
                _logger.LogWarning(ex, "[AchievementBadges] Patch attempt failed at {P}", path);
            }
        }
    }
}
