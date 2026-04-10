using System;
using Jellyfin.Plugin.AchievementBadges.Services;
using MediaBrowser.Controller.Session;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class PlaybackActivityTracker : IDisposable
{
    private readonly ISessionManager _sessionManager;
    private readonly AchievementBadgeService _achievementBadgeService;
    private readonly ILogger<PlaybackActivityTracker> _logger;
    private bool _disposed;

    public PlaybackActivityTracker(
        ISessionManager sessionManager,
        AchievementBadgeService achievementBadgeService,
        ILogger<PlaybackActivityTracker> logger)
    {
        _sessionManager = sessionManager;
        _achievementBadgeService = achievementBadgeService;
        _logger = logger;

        _sessionManager.SessionStarted += OnSessionStarted;
    }

    private void OnSessionStarted(object? sender, SessionEventArgs e)
    {
        try
        {
            if (e.SessionInfo?.UserId == null)
            {
                return;
            }

            _logger.LogDebug("Session started for user {UserId}, achievements will be tracked via playback events.", e.SessionInfo.UserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process session start event.");
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _sessionManager.SessionStarted -= OnSessionStarted;
        _disposed = true;
    }
}