using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Entities;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class PlaybackCompletionService
{
    private readonly AchievementBadgeService _achievementBadgeService;
    private readonly string _dataFilePath;
    private readonly object _lock = new();
    private readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };

    private Dictionary<string, UserPlaybackState> _playbackStates = new();
    // itemId -> list of (userId, completedAt) for co-watch detection (last hour)
    private readonly Dictionary<string, List<(string UserId, DateTimeOffset At)>> _recentCoWatchCandidates = new();
    private readonly object _coWatchLock = new();

    public PlaybackCompletionService(
        AchievementBadgeService achievementBadgeService,
        IApplicationPaths applicationPaths)
    {
        _achievementBadgeService = achievementBadgeService;

        var pluginDataPath = Path.Combine(applicationPaths.PluginConfigurationsPath, "achievementbadges");
        Directory.CreateDirectory(pluginDataPath);

        _dataFilePath = Path.Combine(pluginDataPath, "playbackstate.json");
        Load();
    }

    public bool RecordCompletion(
        string userId,
        string? itemId,
        bool isMovie,
        bool isEpisode,
        bool isSeriesCompleted,
        double completionPercent,
        DateTimeOffset playedAt,
        out string message,
        string? libraryName = null)
    {
        return RecordCompletion(new PlaybackContext
        {
            UserId = userId,
            ItemId = itemId,
            IsMovie = isMovie,
            IsEpisode = isEpisode,
            SeriesCompleted = isSeriesCompleted,
            LibraryName = libraryName,
            PlayedAt = playedAt
        }, completionPercent, out message);
    }

    public bool RecordCompletion(PlaybackContext context, double completionPercent, out string message)
    {
        if (string.IsNullOrWhiteSpace(context.UserId))
        {
            message = "User ID is required.";
            return false;
        }

        if (completionPercent < 80)
        {
            message = $"Completion threshold not met. Current completion is {completionPercent:0.#}% and minimum is 80%.";
            return false;
        }

        var itemId = context.ItemId ?? string.Empty;
        var playedAt = context.PlayedAt ?? DateTimeOffset.Now;
        context.PlayedAt = playedAt;
        var isRewatch = false;

        lock (_lock)
        {
            var state = GetOrCreateState(context.UserId);

            CleanupOldEntries(state, playedAt);

            if (!string.IsNullOrWhiteSpace(itemId) &&
                state.RecentlyCompletedItemIds.TryGetValue(itemId, out var lastSeen))
            {
                if (playedAt - lastSeen < TimeSpan.FromHours(6))
                {
                    message = "This item was already counted recently.";
                    return false;
                }

                isRewatch = true;
            }

            if (!string.IsNullOrWhiteSpace(itemId))
            {
                state.RecentlyCompletedItemIds[itemId] = playedAt;
            }

            state.TotalCompletedItems++;

            if (context.IsMovie)
            {
                state.TotalCompletedMovies++;
            }

            if (context.IsEpisode)
            {
                state.TotalCompletedEpisodes++;
            }

            state.LastCompletionAt = playedAt;

            Save();
        }

        context.IsRewatch = isRewatch;
        _achievementBadgeService.RecordPlayback(context);

        // Co-watch detection: if another user completed the same item within the last hour,
        // award a bonus to both.
        if (!string.IsNullOrWhiteSpace(itemId) && !string.IsNullOrWhiteSpace(context.UserId))
        {
            lock (_coWatchLock)
            {
                var now = DateTimeOffset.UtcNow;
                if (!_recentCoWatchCandidates.TryGetValue(itemId, out var list))
                {
                    list = new List<(string, DateTimeOffset)>();
                    _recentCoWatchCandidates[itemId] = list;
                }

                // Clean entries older than 1 hour
                list.RemoveAll(e => (now - e.At) > TimeSpan.FromHours(1));

                // Check if any OTHER user completed this recently
                var otherUsers = list
                    .Where(e => !string.Equals(e.UserId, context.UserId, StringComparison.OrdinalIgnoreCase))
                    .Select(e => e.UserId)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                // Add current user's completion to the list
                list.Add((context.UserId, now));

                // Award co-watch bonus to each unique other user + the current user
                foreach (var other in otherUsers)
                {
                    _achievementBadgeService.RecordCoWatch(itemId, context.UserId, other);
                }

                // Garbage collect items with no entries
                if (_recentCoWatchCandidates.Count > 500)
                {
                    var stale = _recentCoWatchCandidates.Where(kvp => kvp.Value.Count == 0 || (now - kvp.Value.Max(e => e.At)) > TimeSpan.FromHours(1)).Select(kvp => kvp.Key).ToList();
                    foreach (var s in stale) _recentCoWatchCandidates.Remove(s);
                }
            }
        }

        message = "Playback completion recorded.";
        return true;
    }

    public UserPlaybackState GetState(string userId)
    {
        lock (_lock)
        {
            return CloneState(GetOrCreateState(userId));
        }
    }

    private UserPlaybackState GetOrCreateState(string userId)
    {
        if (!_playbackStates.TryGetValue(userId, out var state))
        {
            state = new UserPlaybackState
            {
                UserId = userId
            };

            _playbackStates[userId] = state;
            Save();
        }

        return state;
    }

    private static void CleanupOldEntries(UserPlaybackState state, DateTimeOffset now)
    {
        var toRemove = new List<string>();

        foreach (var pair in state.RecentlyCompletedItemIds)
        {
            if (now - pair.Value > TimeSpan.FromDays(90))
            {
                toRemove.Add(pair.Key);
            }
        }

        foreach (var key in toRemove)
        {
            state.RecentlyCompletedItemIds.Remove(key);
        }
    }

    private void Load()
    {
        if (!File.Exists(_dataFilePath))
        {
            _playbackStates = new Dictionary<string, UserPlaybackState>();
            return;
        }

        try
        {
            var json = File.ReadAllText(_dataFilePath);
            _playbackStates = JsonSerializer.Deserialize<Dictionary<string, UserPlaybackState>>(json, _jsonOptions)
                ?? new Dictionary<string, UserPlaybackState>();
        }
        catch
        {
            _playbackStates = new Dictionary<string, UserPlaybackState>();
        }
    }

    private void Save()
    {
        var json = JsonSerializer.Serialize(_playbackStates, _jsonOptions);
        File.WriteAllText(_dataFilePath, json);
    }

    private static UserPlaybackState CloneState(UserPlaybackState state)
    {
        return new UserPlaybackState
        {
            UserId = state.UserId,
            RecentlyCompletedItemIds = new Dictionary<string, DateTimeOffset>(state.RecentlyCompletedItemIds),
            TotalCompletedItems = state.TotalCompletedItems,
            TotalCompletedMovies = state.TotalCompletedMovies,
            TotalCompletedEpisodes = state.TotalCompletedEpisodes,
            LastCompletionAt = state.LastCompletionAt
        };
    }
}
