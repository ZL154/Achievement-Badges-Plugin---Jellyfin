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
    private const string Marker =
        "<!-- achievementbadges-bootstrap -->";

    // Three script tags, served by AchievementBadgesController's
    // client-script/{name} endpoint. sidebar.js handles nav injection,
    // standalone.js is the achievements page shell, enhance.js is the
    // toast + polling loop.
    private const string ScriptBlock =
        Marker +
        "<script src=\"/Plugins/AchievementBadges/client-script/sidebar\"></script>" +
        "<script src=\"/Plugins/AchievementBadges/client-script/standalone\" defer></script>" +
        "<script src=\"/Plugins/AchievementBadges/client-script/enhance\" defer></script>";

    private readonly IApplicationPaths _appPaths;
    private readonly ILogger<WebInjectionService> _logger;

    public WebInjectionService(IApplicationPaths appPaths, ILogger<WebInjectionService> logger)
    {
        _appPaths = appPaths;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
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

                var html = await File.ReadAllTextAsync(path).ConfigureAwait(false);

                if (html.Contains(Marker, StringComparison.Ordinal))
                {
                    _logger.LogInformation("[AchievementBadges] index.html already patched at {P}", path);
                    return;
                }

                if (!html.Contains("</body>", StringComparison.OrdinalIgnoreCase)) continue;

                var patched = html.Replace("</body>", ScriptBlock + "</body>", StringComparison.OrdinalIgnoreCase);

                // Atomic write so a crash mid-write doesn't leave Jellyfin's
                // web UI with a truncated index.html.
                var tmp = path + ".ab.tmp";
                await File.WriteAllTextAsync(tmp, patched).ConfigureAwait(false);
                File.Move(tmp, path, overwrite: true);

                _logger.LogInformation("[AchievementBadges] Patched index.html at {P}", path);
                return;
            }
            catch (UnauthorizedAccessException uex)
            {
                _logger.LogWarning("[AchievementBadges] Can't write {P}: {M}", path, uex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[AchievementBadges] Patch attempt failed at {P}", path);
            }
        }
    }
}
