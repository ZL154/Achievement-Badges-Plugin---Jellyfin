using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Common.Configuration;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class PlaybackCompletionService
{
    private readonly AchievementBadgeService _achievementBadgeService;
    private readonly string _dataFilePath;
    private readonly object _lock = new();
    private readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };

    private Dictionary<string, UserPlaybackState> _playbackStates = new();

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
        out string message)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            message = "User ID is required.";
            return false;
        }

        if (completionPercent < 80)
        {
            message = $"Completion threshold not met. Current completion is {completionPercent:0.#}% and minimum is 80%.";
            return false;
        }

        itemId ??= string.Empty;

        lock (_lock)
        {
            var state = GetOrCreateState(userId);

            CleanupOldEntries(state, playedAt);

            if (!string.IsNullOrWhiteSpace(itemId) &&
                state.RecentlyCompletedItemIds.TryGetValue(itemId, out var lastSeen) &&
                playedAt - lastSeen < TimeSpan.FromHours(6))
            {
                message = "This item was already counted recently.";
                return false;
            }

            if (!string.IsNullOrWhiteSpace(itemId))
            {
                state.RecentlyCompletedItemIds[itemId] = playedAt;
            }

            state.TotalCompletedItems++;

            if (isMovie)
            {
                state.TotalCompletedMovies++;
            }

            if (isEpisode)
            {
                state.TotalCompletedEpisodes++;
            }

            state.LastCompletionAt = playedAt;

            Save();
        }

        _achievementBadgeService.RecordPlayback(
            userId,
            isMovie,
            isEpisode,
            isSeriesCompleted,
            null,
            playedAt);

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
            if (now - pair.Value > TimeSpan.FromHours(24))
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
