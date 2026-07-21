using System;
using System.Threading.RateLimiting;
using Jellyfin.Plugin.AchievementBadges.Api;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin.Plugin.AchievementBadges;

public class PluginServiceRegistrator : IPluginServiceRegistrator
{
    public void RegisterServices(IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
    {
        serviceCollection.AddScoped<UserOwnershipFilter>();
        serviceCollection.AddScoped<AdminAuditLogFilter>();

        serviceCollection.AddSingleton<WebhookNotifier>();
        serviceCollection.AddSingleton<AuditLogService>();
        serviceCollection.AddSingleton<AchievementBadgeService>();
        // [v2.1.0 "Open Library" M4] Admin-defined custom badges with
        // compound criteria. Sidecar JSON storage; evaluated alongside
        // built-ins by AchievementBadgeService.EvaluateBadges.
        serviceCollection.AddSingleton<CustomBadgeService>();
        // [v2.1.0 "Open Library" M5] JS Injector plugin presence
        // detection + admin guidance for Linux bare-metal users whose
        // /usr/share/jellyfin/web isn't writable (issue #26, jojolll).
        serviceCollection.AddSingleton<JellyfinJsInjectorBridge>();
        // [v2.1.0 "Open Library" M6] Audit + cleanup for time-windowed
        // badges wrongly awarded by pre-v2.1.0 backfill (issue #27).
        serviceCollection.AddSingleton<TimeWindowedRecomputeService>();
        serviceCollection.AddSingleton<PlaybackCompletionService>();
        serviceCollection.AddSingleton<WatchHistoryBackfillService>();
        serviceCollection.AddSingleton<LibraryCompletionService>();
        serviceCollection.AddSingleton<RecapService>();
        serviceCollection.AddSingleton<RecommendationService>();
        serviceCollection.AddSingleton<QuestService>();
        serviceCollection.AddSingleton<FriendsService>();
        serviceCollection.AddSingleton<MessagingService>();
        // v2.0 - Power-ups + Shop.
        serviceCollection.AddSingleton<PowerUpService>();
        serviceCollection.AddSingleton<ShopService>();

        serviceCollection.AddSingleton<PlaybackCompletionTracker>();
        serviceCollection.AddHostedService(provider => provider.GetRequiredService<PlaybackCompletionTracker>());

        serviceCollection.AddHostedService<SafeStartupRunner>();

        // Disk patcher: writes our script tags into Jellyfin's index.html
        // at startup so they're loaded by every client, including native
        // mobile apps that pre-fetch / cache HTML in ways that bypass the
        // middleware. Keeps the middleware below as a fallback for setups
        // where the web directory isn't writable.
        serviceCollection.AddHostedService<WebInjectionService>();

        // Optional compatibility adapter. It uses reflection so Achievement
        // Badges never acquires a hard dependency on the Plugin Pages plugin.
        serviceCollection.AddHostedService<PluginPagesIntegrationService>();

        serviceCollection.AddTransient<IStartupFilter, SidebarInjectionStartup>();

        // ---------- Rate limiting (F7) ------------------------------------
        // Per-user and per-IP limits for hot endpoints. Keys for user-scoped
        // limits use the authenticated userId (from claim `Jellyfin-UserId`
        // or fallback NameIdentifier); anonymous endpoints key on IP.
        serviceCollection.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = 429;

            // 60 req/min per user on user-scoped endpoints like RecordCompletion
            options.AddPolicy("user-60-per-min", httpContext =>
            {
                var key = GetUserKey(httpContext);
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 60,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });

            // 30 req/min per IP on anonymous profile-card endpoint
            options.AddPolicy("ip-30-per-min", httpContext =>
            {
                var key = GetIpKey(httpContext);
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 30,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });

            // 1 per hour per user — prestige cooldown
            options.AddPolicy("prestige-cooldown", httpContext =>
            {
                var key = GetUserKey(httpContext);
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 1,
                    Window = TimeSpan.FromHours(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });

            // 1 per 5 minutes per user — recompute-library cooldown
            options.AddPolicy("recompute-cooldown", httpContext =>
            {
                var key = GetUserKey(httpContext);
                return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 1,
                    Window = TimeSpan.FromMinutes(5),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });
        });

        // Wire middleware into pipeline (Jellyfin already built the app, so
        // we piggy-back via an IStartupFilter).
        serviceCollection.AddTransient<IStartupFilter, RateLimiterStartup>();
    }

    private static string GetUserKey(Microsoft.AspNetCore.Http.HttpContext ctx)
    {
        var user = ctx.User;
        if (user?.Identity?.IsAuthenticated == true)
        {
            var id = user.FindFirst("Jellyfin-UserId")?.Value
                     ?? user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? user.Identity.Name;
            if (!string.IsNullOrEmpty(id)) return "u:" + id;
        }
        return "ip:" + GetIpKey(ctx);
    }

    private static string GetIpKey(Microsoft.AspNetCore.Http.HttpContext ctx)
    {
        return ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

internal class RateLimiterStartup : IStartupFilter
{
    public Action<Microsoft.AspNetCore.Builder.IApplicationBuilder> Configure(Action<Microsoft.AspNetCore.Builder.IApplicationBuilder> next)
    {
        return builder =>
        {
            builder.UseRateLimiter();
            next(builder);
        };
    }
}
