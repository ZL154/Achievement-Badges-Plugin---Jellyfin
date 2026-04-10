using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin.Plugin.AchievementBadges;

public class PluginServiceRegistrator : IPluginServiceRegistrator
{
    public void RegisterServices(IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
    {
        serviceCollection.AddSingleton<AchievementBadgeService>();
        serviceCollection.AddSingleton<PlaybackActivityTracker>();
        serviceCollection.AddSingleton<PlaybackCompletionService>();
        serviceCollection.AddSingleton<PlaybackCompletionTracker>();

      
        serviceCollection.AddHostedService<SafeStartupRunner>();
    }
}