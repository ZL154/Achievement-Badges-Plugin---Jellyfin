using System;
using System.Globalization;
using System.Reflection;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Session;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class PlaybackCompletionTracker : IDisposable
{
    private readonly ISessionManager _sessionManager;
    private readonly PlaybackCompletionService _playbackCompletionService;
    private readonly ILogger<PlaybackCompletionTracker> _logger;
    private bool _disposed;

    public PlaybackCompletionTracker(
        ISessionManager sessionManager,
        PlaybackCompletionService playbackCompletionService,
        ILogger<PlaybackCompletionTracker> logger)
    {
        _sessionManager = sessionManager;
        _playbackCompletionService = playbackCompletionService;
        _logger = logger;

        _sessionManager.PlaybackProgress += OnPlaybackProgress;
        _sessionManager.PlaybackStopped += OnPlaybackStopped;
    }

    private void OnPlaybackProgress(object? sender, PlaybackProgressEventArgs e)
    {
        TryRecordCompletion(e, "progress");
    }

    private void OnPlaybackStopped(object? sender, PlaybackStopEventArgs e)
    {
        TryRecordCompletion(e, "stopped");
    }

    private void TryRecordCompletion(object eventArgs, string source)
    {
        try
        {
            var userId = ExtractUserId(eventArgs);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return;
            }

            var itemObject = ExtractItemObject(eventArgs);
            if (itemObject is null)
            {
                return;
            }

            var itemId = ExtractItemId(itemObject);
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return;
            }

            var runTimeTicks = ExtractRunTimeTicks(eventArgs, itemObject);
            var positionTicks = ExtractPositionTicks(eventArgs);

            if (runTimeTicks <= 0 || positionTicks <= 0)
            {
                return;
            }

            var completionPercent = (double)positionTicks / runTimeTicks * 100d;
            var itemType = ExtractItemType(itemObject);

            var isMovie = string.Equals(itemType, "Movie", StringComparison.OrdinalIgnoreCase);
            var isEpisode = string.Equals(itemType, "Episode", StringComparison.OrdinalIgnoreCase);

            if (!isMovie && !isEpisode)
            {
                return;
            }

            var success = _playbackCompletionService.RecordCompletion(
                userId: userId,
                itemId: itemId,
                isMovie: isMovie,
                isEpisode: isEpisode,
                isSeriesCompleted: false,
                completionPercent: completionPercent,
                playedAt: DateTimeOffset.Now,
                message: out var message);

            if (success)
            {
                _logger.LogInformation(
                    "Recorded playback completion from {Source} for user {UserId}, item {ItemId}, completion {CompletionPercent:0.##}%",
                    source,
                    userId,
                    itemId,
                    completionPercent);
            }
            else
            {
                _logger.LogDebug(
                    "Skipped playback completion from {Source} for user {UserId}, item {ItemId}. Reason: {Reason}",
                    source,
                    userId,
                    itemId,
                    message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process playback completion tracking from {Source}.", source);
        }
    }

    private static string ExtractUserId(object eventArgs)
    {
        var directUserId = GetPropertyValue(eventArgs, "UserId");
        if (directUserId is not null)
        {
            return ConvertToString(directUserId);
        }

        var sessionInfo = GetPropertyValue(eventArgs, "SessionInfo");
        if (sessionInfo is not null)
        {
            var nestedUserId = GetPropertyValue(sessionInfo, "UserId");
            if (nestedUserId is not null)
            {
                return ConvertToString(nestedUserId);
            }
        }

        return string.Empty;
    }

    private static object? ExtractItemObject(object eventArgs)
    {
        return GetPropertyValue(eventArgs, "Item")
            ?? GetPropertyValue(eventArgs, "NowPlayingItem");
    }

    private static string ExtractItemId(object itemObject)
    {
        var idValue = GetPropertyValue(itemObject, "Id");
        return idValue is null ? string.Empty : ConvertToString(idValue);
    }

    private static string ExtractItemType(object itemObject)
    {
        var typeValue = GetPropertyValue(itemObject, "Type");
        return typeValue is null ? string.Empty : ConvertToString(typeValue);
    }

    private static long ExtractRunTimeTicks(object eventArgs, object itemObject)
    {
        var eventRunTime = GetPropertyValue(eventArgs, "RunTimeTicks");
        var itemRunTime = GetPropertyValue(itemObject, "RunTimeTicks");

        var eventRunTimeLong = ConvertToLong(eventRunTime);
        if (eventRunTimeLong > 0)
        {
            return eventRunTimeLong;
        }

        return ConvertToLong(itemRunTime);
    }

    private static long ExtractPositionTicks(object eventArgs)
    {
        var playbackPositionTicks = GetPropertyValue(eventArgs, "PlaybackPositionTicks");
        var playbackPositionTicksLong = ConvertToLong(playbackPositionTicks);
        if (playbackPositionTicksLong > 0)
        {
            return playbackPositionTicksLong;
        }

        var positionTicks = GetPropertyValue(eventArgs, "PositionTicks");
        var positionTicksLong = ConvertToLong(positionTicks);
        if (positionTicksLong > 0)
        {
            return positionTicksLong;
        }

        var position = GetPropertyValue(eventArgs, "Position");
        var positionLong = ConvertToLong(position);
        if (positionLong > 0)
        {
            return positionLong;
        }

        return 0;
    }

    private static object? GetPropertyValue(object source, string propertyName)
    {
        var type = source.GetType();
        var property = type.GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
        return property?.GetValue(source);
    }

    private static string ConvertToString(object value)
    {
        if (value is Guid guid)
        {
            return guid.ToString("D");
        }

        var type = value.GetType();

        if (type == typeof(Guid?))
        {
            var boxed = (Guid?)value;
            if (boxed.HasValue)
            {
                return boxed.Value.ToString("D");
            }
        }

        return value.ToString() ?? string.Empty;
    }

    private static long ConvertToLong(object? value)
    {
        if (value is null)
        {
            return 0;
        }

        if (value is long longValue)
        {
            return longValue;
        }

        if (value is int intValue)
        {
            return intValue;
        }

        if (value is double doubleValue)
        {
            return (long)doubleValue;
        }

        if (value is float floatValue)
        {
            return (long)floatValue;
        }

        if (value is decimal decimalValue)
        {
            return (long)decimalValue;
        }

        var type = value.GetType();

        if (type == typeof(long?))
        {
            var boxed = (long?)value;
            return boxed ?? 0;
        }

        if (type == typeof(int?))
        {
            var boxed = (int?)value;
            return boxed ?? 0;
        }

        if (type == typeof(double?))
        {
            var boxed = (double?)value;
            return boxed.HasValue ? (long)boxed.Value : 0;
        }

        if (type == typeof(float?))
        {
            var boxed = (float?)value;
            return boxed.HasValue ? (long)boxed.Value : 0;
        }

        if (type == typeof(decimal?))
        {
            var boxed = (decimal?)value;
            return boxed.HasValue ? (long)boxed.Value : 0;
        }

        return long.TryParse(value.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : 0;
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _sessionManager.PlaybackProgress -= OnPlaybackProgress;
        _sessionManager.PlaybackStopped -= OnPlaybackStopped;
        _disposed = true;
    }
}