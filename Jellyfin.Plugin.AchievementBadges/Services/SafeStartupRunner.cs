using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class SafeStartupRunner : IHostedService
{
    private readonly ILogger<SafeStartupRunner> _logger;
    private readonly AchievementBadgeService _badgeService;

    public SafeStartupRunner(ILogger<SafeStartupRunner> logger, AchievementBadgeService badgeService)
    {
        _logger = logger;
        _badgeService = badgeService;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                _logger.LogInformation("AchievementBadges: Delayed startup begin...");

                await Task.Delay(8000, cancellationToken);

                FileTransformationIntegration.SetLogger(_logger);
                FileTransformationIntegration.TryInject();

                _logger.LogInformation("AchievementBadges: Injection complete.");

                // [issue #24] One-time migration: fold legacy visual-builder
                // custom badges (config.CustomBadges) into the sidecar store the
                // management UI reads, so pre-update badges become visible and
                // deletable. Runs before re-evaluation so migrated badges are
                // scored in the same pass. Idempotent (clears the legacy list).
                try
                {
                    var moved = _badgeService.MigrateLegacyConfigCustomBadges();
                    if (moved > 0)
                    {
                        _logger.LogInformation("[AchievementBadges] Legacy custom-badge migration moved {Count} badge(s) into the sidecar store.", moved);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[AchievementBadges] Legacy custom-badge migration failed.");
                }

                // Re-evaluate every user's badges against the current definitions so that
                // any new badges added in this release auto-unlock for users whose counters
                // already satisfy them, without requiring them to open their achievements page.
                try
                {
                    var count = _badgeService.EvaluateAllProfiles();
                    _logger.LogInformation("[AchievementBadges] Startup re-evaluation processed {Count} profiles.", count);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[AchievementBadges] Startup re-evaluation failed.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AchievementBadges: Injection failed.");
            }
        }, cancellationToken);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
