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
    private readonly AuditLogService? _auditLog;
    private readonly string _dataFilePath;
    private readonly object _lock = new();
    // v1.8.60: WriteIndented=false. See AchievementBadgeService for rationale.
    private readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = false };

    private Dictionary<string, UserPlaybackState> _playbackStates = new();
    // itemId -> list of (userId, completedAt) for co-watch detection (last hour)
    private readonly Dictionary<string, List<(string UserId, DateTimeOffset At)>> _recentCoWatchCandidates = new();
    private readonly object _coWatchLock = new();

    public PlaybackCompletionService(
        AchievementBadgeService achievementBadgeService,
        IApplicationPaths applicationPaths,
        AuditLogService? auditLog = null)
    {
        _achievementBadgeService = achievementBadgeService;
        _auditLog = auditLog;

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

            // v1.9.8 — Daily watch-rate cap. Tracks credited items per UTC
            // day. Real users watching real content never hit this; it's
            // pure defense in depth against the spam-click exploit class.
            var cfg = Plugin.Instance?.Configuration;
            var today = playedAt.UtcDateTime.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
            state.CreditedItemsByDate.TryGetValue(today, out var todayCount);
            if (cfg?.EnableDailyCreditCap == true && cfg.DailyCreditCap > 0 && todayCount >= cfg.DailyCreditCap)
            {
                message = $"Daily credit cap reached ({cfg.DailyCreditCap}/day). Try again tomorrow.";
                // Log only the FIRST time per day we hit the cap; subsequent
                // attempts in the same day stay silent to avoid spam.
                if (todayCount == cfg.DailyCreditCap)
                {
                    _auditLog?.Log(context.UserId, string.Empty, "rate_cap_blocked",
                        $"User hit daily credit cap of {cfg.DailyCreditCap} items on {today}.");
                }
                return false;
            }

            // v1.9.8 — Suspicious-rate flag. Track timestamps of credits in a
            // rolling 1h window; if the user crosses SuspiciousRatePerHour
            // emit an audit-log entry (throttled to once per hour per user).
            // Visibility only — does not block the credit.
            state.RecentCreditTimestamps.RemoveAll(t => playedAt - t > TimeSpan.FromHours(1));
            state.RecentCreditTimestamps.Add(playedAt);
            if (state.RecentCreditTimestamps.Count > 256)
            {
                state.RecentCreditTimestamps.RemoveRange(0, state.RecentCreditTimestamps.Count - 256);
            }
            if (cfg?.EnableSuspiciousActivityFlag == true && cfg.SuspiciousRatePerHour > 0
                && state.RecentCreditTimestamps.Count >= cfg.SuspiciousRatePerHour
                && (state.LastSuspiciousFlagAt is null
                    || playedAt - state.LastSuspiciousFlagAt.Value > TimeSpan.FromHours(1)))
            {
                _auditLog?.Log(context.UserId, string.Empty, "suspicious_rate",
                    $"User credited {state.RecentCreditTimestamps.Count} items in the last hour (threshold {cfg.SuspiciousRatePerHour}).");
                state.LastSuspiciousFlagAt = playedAt;
            }

            // Prune the date dictionary to last 30 days so it doesn't grow
            // unbounded over months.
            if (state.CreditedItemsByDate.Count > 60)
            {
                var cutoff = playedAt.UtcDateTime.AddDays(-30);
                var stale = state.CreditedItemsByDate
                    .Where(kvp => !System.DateTime.TryParseExact(kvp.Key, "yyyy-MM-dd",
                        System.Globalization.CultureInfo.InvariantCulture,
                        System.Globalization.DateTimeStyles.AssumeUniversal, out var d) || d < cutoff)
                    .Select(kvp => kvp.Key)
                    .ToList();
                foreach (var key in stale) state.CreditedItemsByDate.Remove(key);
            }
            state.CreditedItemsByDate[today] = todayCount + 1;

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

        // v1.8.57: invalidate the LastWatched cache for this user — a fresh
        // play just landed, so the next friends-list call should reflect it
        // immediately instead of waiting for the 90s TTL to expire.
        if (!string.IsNullOrWhiteSpace(context.UserId)
            && Guid.TryParse(context.UserId, out var watchedUserGuid))
        {
            FriendsService.InvalidateLastWatched(watchedUserGuid);
        }

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

    /// <summary>[v2.1.x, issue #24] Record a finished/read ebook. Ebooks never
    /// emit playback sessions, so they can't go through RecordCompletion's
    /// completion-percent gate — being "marked read" (IsPlayed) IS the
    /// completion signal. Credit directly so Book badges (BooksCompleted)
    /// actually track. Real-time entry from PlaybackCompletionTracker's
    /// UserDataSaved hook; backfill uses RecordPlayback the same way.</summary>
    public void RecordBookCompletion(PlaybackContext context)
    {
        if (context is null)
        {
            return;
        }

        _achievementBadgeService.RecordPlayback(context);

        if (!string.IsNullOrWhiteSpace(context.UserId)
            && Guid.TryParse(context.UserId, out var bookUserGuid))
        {
            FriendsService.InvalidateLastWatched(bookUserGuid);
        }
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
        // Atomic write: serialize to .tmp then rename. Prevents state loss if
        // the process is killed mid-write.
        var tmp = _dataFilePath + ".tmp";
        File.WriteAllText(tmp, json);
        File.Move(tmp, _dataFilePath, overwrite: true);
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
            LastCompletionAt = state.LastCompletionAt,
            CreditedItemsByDate = new Dictionary<string, int>(state.CreditedItemsByDate),
            RecentCreditTimestamps = new List<DateTimeOffset>(state.RecentCreditTimestamps),
            LastSuspiciousFlagAt = state.LastSuspiciousFlagAt
        };
    }
}
