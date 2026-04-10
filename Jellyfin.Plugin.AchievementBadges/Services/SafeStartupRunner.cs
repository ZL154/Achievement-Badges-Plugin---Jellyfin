using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class SafeStartupRunner : IHostedService
{
    private readonly ILogger<SafeStartupRunner> _logger;

    public SafeStartupRunner(ILogger<SafeStartupRunner> logger)
    {
        _logger = logger;
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