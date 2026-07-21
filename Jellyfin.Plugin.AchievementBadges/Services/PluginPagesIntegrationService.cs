using System;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// Registers the shared achievements surface with the optional Plugin Pages
/// plugin without linking against its assembly. Any compatibility failure is
/// isolated and cannot prevent Jellyfin or Achievement Badges from starting.
/// </summary>
public sealed class PluginPagesIntegrationService : IHostedService
{
    private const string ManagerTypeName = "Jellyfin.Plugin.PluginPages.Library.IPluginPagesManager";
    private const string PageTypeName = "Jellyfin.Plugin.PluginPages.Library.PluginPage";
    private readonly IServiceProvider _services;
    private readonly ILogger<PluginPagesIntegrationService> _logger;

    public PluginPagesIntegrationService(
        IServiceProvider services,
        ILogger<PluginPagesIntegrationService> logger)
    {
        _services = services;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (Plugin.Instance?.Configuration.EnablePluginPagesIntegration != true)
        {
            return Task.CompletedTask;
        }

        try
        {
            var assemblies = AppDomain.CurrentDomain.GetAssemblies();
            var managerType = assemblies.Select(a => a.GetType(ManagerTypeName, false)).FirstOrDefault(t => t is not null);
            var pageType = assemblies.Select(a => a.GetType(PageTypeName, false)).FirstOrDefault(t => t is not null);
            if (managerType is null || pageType is null)
            {
                _logger.LogWarning("[AchievementBadges] Plugin Pages integration is enabled, but Plugin Pages is not installed or its API is unavailable.");
                return Task.CompletedTask;
            }

            var manager = _services.GetService(managerType);
            var page = Activator.CreateInstance(pageType);
            var register = managerType.GetMethod("RegisterPluginPage", BindingFlags.Instance | BindingFlags.Public);
            if (manager is null || page is null || register is null)
            {
                _logger.LogWarning("[AchievementBadges] Plugin Pages was found, but its registration service is unavailable.");
                return Task.CompletedTask;
            }

            SetProperty(pageType, page, "Id", "achievement-badges");
            SetProperty(pageType, page, "Url", "/Plugins/AchievementBadges/embedded-page");
            SetProperty(pageType, page, "DisplayText", "Achievements");
            SetProperty(pageType, page, "Icon", "emoji_events");
            register.Invoke(manager, new[] { page });
            _logger.LogInformation("[AchievementBadges] Registered the Achievements surface with Plugin Pages.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[AchievementBadges] Plugin Pages registration failed; the stock Achievements page remains available.");
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static void SetProperty(Type pageType, object page, string name, string value)
    {
        pageType.GetProperty(name, BindingFlags.Instance | BindingFlags.Public)?.SetValue(page, value);
    }
}
