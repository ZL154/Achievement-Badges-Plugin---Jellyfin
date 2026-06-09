using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// [v2.1.0 "Open Library" M5] Lightweight presence-detection bridge to
/// the third-party Jellyfin JavaScript Injector plugin
/// (https://github.com/n00bcodr/Jellyfin-JavaScript-Injector). v2.0.x
/// AchievementBadges patches Jellyfin's index.html on disk, which fails
/// on Linux bare-metal installs where <c>/usr/share/jellyfin/web</c> is
/// owned by root and not writable by the Jellyfin user (jojolll's #26).
///
/// We deliberately do NOT call into JS Injector's API. Its surface
/// has changed across versions and is not a stable integration point.
/// Instead we detect that the plugin is installed and surface admin
/// guidance with the exact 3 script URLs to paste into JS Injector's
/// settings. The admin does a one-time copy-paste; from then on the
/// scripts load through JS Injector's mechanism, which doesn't need
/// the Jellyfin web directory to be writable.
/// </summary>
public class JellyfinJsInjectorBridge
{
    // Filesystem-detection signature — case-insensitive substring
    // match against any folder name under Jellyfin's plugins
    // directory. Catches whatever versioned form the JS Injector
    // plugin's install directory takes (e.g. "JavaScript Injector_1.2.3.0").
    private const string JsInjectorNameSubstring = "javascript injector";

    private readonly IApplicationPaths _appPaths;
    private readonly ILogger<JellyfinJsInjectorBridge> _logger;

    public JellyfinJsInjectorBridge(IApplicationPaths appPaths,
                                    ILogger<JellyfinJsInjectorBridge> logger)
    {
        _appPaths = appPaths;
        _logger = logger;
    }

    /// <summary>Is the JS Injector plugin installed? Detection is
    /// filesystem-based — we look for a folder under Jellyfin's
    /// plugins directory whose name matches "javascript injector"
    /// case-insensitively. Avoids guessing the unstable plugin-manager
    /// SDK surface; works against any Jellyfin 10.11.x ABI.</summary>
    public bool IsInstalled()
    {
        try
        {
            var pluginsPath = _appPaths.PluginsPath;
            if (string.IsNullOrEmpty(pluginsPath) || !Directory.Exists(pluginsPath)) return false;
            foreach (var dir in Directory.EnumerateDirectories(pluginsPath))
            {
                var name = Path.GetFileName(dir);
                if (string.IsNullOrEmpty(name)) continue;
                if (name.Contains(JsInjectorNameSubstring, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "[AchievementBadges] JS Injector presence check threw — assuming not installed");
        }
        return false;
    }

    public IReadOnlyList<string> GetScriptUrls()
    {
        var ver = typeof(WebInjectionService).Assembly.GetName().Version?.ToString() ?? "0";
        return new[]
        {
            $"/Plugins/AchievementBadges/client-script/sidebar?v={ver}",
            $"/Plugins/AchievementBadges/client-script/standalone?v={ver}",
            $"/Plugins/AchievementBadges/client-script/enhance?v={ver}",
        };
    }

    public string? GetAdminGuidance(bool diskPatchSucceeded)
    {
        if (diskPatchSucceeded) return null;
        if (!IsInstalled())
        {
            return "Jellyfin's web directory is not writable. Either (a) chmod the web directory so the Jellyfin user can write to it, or (b) install the Jellyfin JavaScript Injector plugin from the catalog and re-open this page for paste-in instructions.";
        }
        var urls = GetScriptUrls();
        return "Jellyfin's web directory is not writable, but the JS Injector plugin is installed. Paste the following 3 URLs into JS Injector's settings (Dashboard → Plugins → JavaScript Injector) — one URL per script:\n  - " + string.Join("\n  - ", urls) + "\nThen restart Jellyfin. The Achievement Badges UI will load through JS Injector instead of the on-disk patch.";
    }
}
