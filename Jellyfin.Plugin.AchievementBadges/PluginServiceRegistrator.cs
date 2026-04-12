using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin.Plugin.AchievementBadges;

public class PluginServiceRegistrator : IPluginServiceRegistrator
{
    public void RegisterServices(IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
    {
        serviceCollection.AddSingleton<WebhookNotifier>();
        serviceCollection.AddSingleton<AuditLogService>();
        serviceCollection.AddSingleton<AchievementBadgeService>();
        serviceCollection.AddSingleton<PlaybackCompletionService>();
        serviceCollection.AddSingleton<WatchHistoryBackfillService>();
        serviceCollection.AddSingleton<LibraryCompletionService>();
        serviceCollection.AddSingleton<RecapService>();
        serviceCollection.AddSingleton<RecommendationService>();
        serviceCollection.AddSingleton<QuestService>();

        serviceCollection.AddSingleton<PlaybackCompletionTracker>();
        serviceCollection.AddHostedService(provider => provider.GetRequiredService<PlaybackCompletionTracker>());

        serviceCollection.AddHostedService<SafeStartupRunner>();

        // Disk patcher: writes our script tags into Jellyfin's index.html
        // at startup so they're loaded by every client, including native
        // mobile apps that pre-fetch / cache HTML in ways that bypass the
        // middleware. Keeps the middleware below as a fallback for setups
        // where the web directory isn't writable.
        serviceCollection.AddHostedService<WebInjectionService>();

        serviceCollection.AddTransient<IStartupFilter, SidebarInjectionStartup>();
    }
}
