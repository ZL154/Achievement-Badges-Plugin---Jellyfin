using System;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges;

public static class FileTransformationIntegration
{
    private static ILogger? _logger;

    public static void SetLogger(ILogger logger)
    {
        _logger = logger;
    }

    public static void TryInject()
    {
        try
        {
            _logger?.LogInformation("AchievementBadges: FileTransformation injection point reached. No injection rules configured.");
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "AchievementBadges: FileTransformation injection encountered an error.");
        }
    }
}
