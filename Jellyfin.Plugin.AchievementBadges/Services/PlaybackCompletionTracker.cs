using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Session;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class PlaybackCompletionTracker : IHostedService, IDisposable
{
    private readonly ISessionManager _sessionManager;
    private readonly ILibraryManager _libraryManager;
    private readonly PlaybackCompletionService _playbackCompletionService;
    private readonly ILogger<PlaybackCompletionTracker> _logger;
    private bool _subscribed;
    private bool _disposed;

    // v1.9.8 — Per-session play-time tracker. Closes the spam-click /
    // seek-to-end / mark-as-played exploits: we now track REAL accumulated
    // play ticks instead of trusting position/runtime ratios or Jellyfin's
    // PlayedToCompletion flag. A "good" delta is 0 < delta < ~15s of
    // position movement between progress events; seeks and rewinds don't
    // accumulate. Credit only fires from PlaybackStopped.
    private const long MaxGoodDeltaTicks = 15L * TimeSpan.TicksPerSecond;

    // v1.9.8 — Minimum runtime for an item to be credited as a real watch.
    // Filters out Projectionist prerolls / Intros plugins / bumpers that
    // register short clips into the Movie or Episode library type but
    // aren't real watch sessions. No real film or episode runs under a
    // minute, so 60s is a safe floor.
    private const long MinItemRuntimeTicks = 60L * TimeSpan.TicksPerSecond;
    private sealed class SessionWatchState
    {
        public string? ItemId;
        public long LastPositionTicks;
        public long AccumulatedPlayTicks;
        public DateTimeOffset StartedAt;
        public int ProgressEventCount;
    }
    private readonly ConcurrentDictionary<string, SessionWatchState> _sessions = new();

    public PlaybackCompletionTracker(
        ISessionManager sessionManager,
        ILibraryManager libraryManager,
        PlaybackCompletionService playbackCompletionService,
        ILogger<PlaybackCompletionTracker> logger)
    {
        _sessionManager = sessionManager;
        _libraryManager = libraryManager;
        _playbackCompletionService = playbackCompletionService;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_subscribed)
        {
            _sessionManager.PlaybackProgress += OnPlaybackProgress;
            _sessionManager.PlaybackStopped += OnPlaybackStopped;
            _subscribed = true;
            _logger.LogInformation("[AchievementBadges] PlaybackCompletionTracker started, subscribed to session events.");
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        Unsubscribe();
        return Task.CompletedTask;
    }

    private void Unsubscribe()
    {
        if (!_subscribed)
        {
            return;
        }

        _sessionManager.PlaybackProgress -= OnPlaybackProgress;
        _sessionManager.PlaybackStopped -= OnPlaybackStopped;
        _subscribed = false;
    }

    private void OnPlaybackProgress(object? sender, PlaybackProgressEventArgs e)
    {
        // v1.9.8 — Progress events only update accumulated play time.
        // Credit is decided exclusively at stop. Previously this path also
        // called TryRecordCompletion using position/runtime ratio, which
        // let a user seek to 90% and trigger a credit without watching.
        UpdateSessionState(e);
    }

    private void OnPlaybackStopped(object? sender, PlaybackStopEventArgs e)
    {
        // v1.9.8 — Final tick update so the last delta is captured, then
        // decide credit based on accumulated play ticks. PlayedToCompletion
        // is now informational only; we do NOT trust it to bypass the gate.
        UpdateSessionState(e);
        TryRecordCompletion(e, "stopped", playedToCompletion: e.PlayedToCompletion);
    }

    /// <summary>
    /// v1.9.8 — Update per-session accumulated play ticks. A "good" delta
    /// (0 < delta < MaxGoodDeltaTicks of position advancement between events)
    /// is added; large positive deltas (seeks) and negative deltas (rewinds)
    /// are not counted. Item-change inside the same session resets state.
    /// </summary>
    private void UpdateSessionState(PlaybackProgressEventArgs e)
    {
        try
        {
            var sessionId = e.Session?.Id;
            if (string.IsNullOrWhiteSpace(sessionId))
            {
                return;
            }

            var item = e.Item;
            if (item is null)
            {
                return;
            }

            var itemId = item.Id.ToString("D");
            var positionTicks = e.PlaybackPositionTicks ?? 0;

            _sessions.AddOrUpdate(
                sessionId,
                _ => new SessionWatchState
                {
                    ItemId = itemId,
                    LastPositionTicks = positionTicks,
                    AccumulatedPlayTicks = 0,
                    StartedAt = DateTimeOffset.UtcNow,
                    ProgressEventCount = 1
                },
                (_, prev) =>
                {
                    // If the user switched to a different item inside the
                    // same session, reset accumulator to that new item.
                    if (!string.Equals(prev.ItemId, itemId, StringComparison.OrdinalIgnoreCase))
                    {
                        return new SessionWatchState
                        {
                            ItemId = itemId,
                            LastPositionTicks = positionTicks,
                            AccumulatedPlayTicks = 0,
                            StartedAt = DateTimeOffset.UtcNow,
                            ProgressEventCount = 1
                        };
                    }
                    var delta = positionTicks - prev.LastPositionTicks;
                    if (delta > 0 && delta <= MaxGoodDeltaTicks)
                    {
                        prev.AccumulatedPlayTicks += delta;
                    }
                    prev.LastPositionTicks = positionTicks;
                    prev.ProgressEventCount++;
                    return prev;
                });
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "[AchievementBadges] UpdateSessionState failed.");
        }
    }

    private void TryRecordCompletion(PlaybackProgressEventArgs e, string source, bool playedToCompletion)
    {
        try
        {
            var userGuid = ResolveUserId(e);
            if (userGuid == Guid.Empty)
            {
                _logger.LogDebug("[AchievementBadges] {Source} event: no user id resolved.", source);
                return;
            }

            var userId = userGuid.ToString("D");
            var item = e.Item;
            if (item is null)
            {
                _logger.LogDebug("[AchievementBadges] {Source} event for user {UserId}: null Item.", source, userId);
                return;
            }

            var itemId = item.Id.ToString("D");
            var itemType = item.GetType().Name;
            var isMovie = string.Equals(itemType, "Movie", StringComparison.OrdinalIgnoreCase);
            var isEpisode = string.Equals(itemType, "Episode", StringComparison.OrdinalIgnoreCase);
            // [v2.1.0 "Open Library", M2/M3] Multi-media — v2.0.x bailed
            // on anything non-Movie/Episode here. Now route Audio (music
            // tracks), AudioBook, and Book items through the same
            // pipeline. Each gets its own IsMusic/IsAudiobook/IsBook
            // flag on the resulting PlaybackContext so the achievement
            // service can update the right counter group.
            var isMusic = string.Equals(itemType, "Audio", StringComparison.OrdinalIgnoreCase);
            var isAudiobook = string.Equals(itemType, "AudioBook", StringComparison.OrdinalIgnoreCase);
            var isBook = string.Equals(itemType, "Book", StringComparison.OrdinalIgnoreCase);

            if (!isMovie && !isEpisode && !isMusic && !isAudiobook && !isBook)
            {
                return;
            }

            var runTimeTicks = item.RunTimeTicks ?? 0;

            // v1.9.8 — Reject items shorter than 60s. Projectionist prerolls,
            // Intros plugins, and bumpers register short clips into the
            // Movie/Episode library type, so without this gate every preroll
            // play credits +1 movie. Real films/episodes are never <1m.
            if (runTimeTicks > 0 && runTimeTicks < MinItemRuntimeTicks)
            {
                _logger.LogDebug(
                    "[AchievementBadges] {Source} for user {UserId} item {ItemId}: runtime {Seconds}s below 60s floor; treating as preroll/intro and skipping credit.",
                    source, userId, itemId, runTimeTicks / TimeSpan.TicksPerSecond);
                // Drop any session state we accumulated for this short item
                // so it doesn't leak into the next session.
                var prerollSessionId = e.Session?.Id;
                if (!string.IsNullOrWhiteSpace(prerollSessionId))
                {
                    _sessions.TryRemove(prerollSessionId, out _);
                }
                return;
            }

            // v1.9.8 — Read accumulated play ticks for this session. This is
            // the real number of position-time the user actually advanced
            // through (seeks excluded). We then remove the session from the
            // tracker since the playback is ending.
            long accumulatedPlayTicks = 0;
            int progressEventCount = 0;
            var sessionId = e.Session?.Id;
            if (!string.IsNullOrWhiteSpace(sessionId)
                && _sessions.TryRemove(sessionId, out var session))
            {
                accumulatedPlayTicks = session.AccumulatedPlayTicks;
                progressEventCount = session.ProgressEventCount;
            }

            double completionPercent;
            if (runTimeTicks > 0)
            {
                completionPercent = (double)accumulatedPlayTicks / runTimeTicks * 100d;
            }
            else
            {
                _logger.LogDebug(
                    "[AchievementBadges] {Source} event for user {UserId} item {ItemId}: runtime ticks unavailable; skipping credit.",
                    source, userId, itemId);
                return;
            }

            // Visibility for admins debugging "why didn't this credit?":
            // log the gap between Jellyfin's PlayedToCompletion flag and our
            // accumulated-tick view. This is the canonical signal that a
            // user is attempting to spam-click / seek-to-end / mark-as-played
            // their way to a badge unlock.
            if (playedToCompletion && completionPercent < 80d)
            {
                _logger.LogInformation(
                    "[AchievementBadges] {Source} event for user {UserId} item {ItemId}: PlayedToCompletion=true but accumulated watch is only {Completion:0.##}% (progressEvents={Events}). Refusing credit; this is the expected behavior for seek-to-end / mark-as-played / 0-second-watch attempts.",
                    source, userId, itemId, completionPercent, progressEventCount);
            }

            var libraryName = ResolveLibraryName(item);
            var (directors, actors) = GetPeople(item);

            var context = new PlaybackContext
            {
                UserId = userId,
                ItemId = itemId,
                IsMovie = isMovie,
                IsEpisode = isEpisode,
                // [v2.1.0 "Open Library", M2/M3] Multi-media flags + music
                // metadata. Reflection-safe so older Jellyfin SDKs that
                // expose Album / Artists differently still build.
                IsMusic = isMusic,
                IsAudiobook = isAudiobook,
                IsBook = isBook,
                Album = isMusic || isAudiobook ? GetItemString(item, "Album") : null,
                Artists = isMusic || isAudiobook ? GetItemStringList(item, "Artists") : null,
                AlbumArtists = isMusic ? GetItemStringList(item, "AlbumArtists") : null,
                SeriesCompleted = false,
                LibraryName = libraryName,
                PlayedAt = DateTimeOffset.Now,
                ProductionYear = item.ProductionYear,
                ProductionLocations = item.ProductionLocations,
                OriginalLanguage = GetOriginalLanguage(item),
                Genres = GetEffectiveGenres(item),
                // [v2.1.0 "Open Library", issue #25] Pass Tags through so the
                // anime detector + future tag-driven badges can match against
                // them. Daemon-Network's setup uses Tags rather than Genres
                // and v2.0.x only read Genres. Inherits from parent Series
                // for Episodes since genres/tags typically live on the Series
                // node, not on each Episode.
                Tags = GetEffectiveTags(item),
                RunTimeTicks = item.RunTimeTicks,
                Directors = directors,
                Actors = actors,
                // v1.9.3 — populate studio + series-position fields so the
                // achievement service can credit Studio specialists and
                // pilot/completer behavior badges.
                Studios = item.Studios,
                SeriesId = isEpisode ? GetSeriesIdString(item) : null,
                SeasonNumber = isEpisode ? item.ParentIndexNumber : null,
                EpisodeNumber = isEpisode ? item.IndexNumber : null
            };

            var success = _playbackCompletionService.RecordCompletion(context, completionPercent, out var message);

            if (success)
            {
                _logger.LogInformation(
                    "[AchievementBadges] Recorded playback from {Source} user={UserId} item={ItemId} library={Library} completion={Completion:0.##}%",
                    source, userId, itemId, libraryName ?? "(none)", completionPercent);
            }
            else
            {
                _logger.LogDebug(
                    "[AchievementBadges] Skipped playback from {Source} user={UserId} item={ItemId} reason={Reason}",
                    source, userId, itemId, message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AchievementBadges] Failed to process playback completion from {Source}.", source);
        }
    }

    private static Guid ResolveUserId(PlaybackProgressEventArgs e)
    {
        if (e.Session is { UserId: var sessionUserId } && sessionUserId != Guid.Empty)
        {
            return sessionUserId;
        }

        if (e.Users is { Count: > 0 })
        {
            var first = e.Users[0];
            if (first is not null && first.Id != Guid.Empty)
            {
                return first.Id;
            }
        }

        return Guid.Empty;
    }

    private (System.Collections.Generic.List<string> directors, System.Collections.Generic.List<string> actors) GetPeople(BaseItem item)
    {
        var directors = new System.Collections.Generic.List<string>();
        var actors = new System.Collections.Generic.List<string>();
        try
        {
            var people = _libraryManager.GetPeople(item);
            if (people == null) return (directors, actors);
            foreach (var p in people)
            {
                if (p is null || string.IsNullOrWhiteSpace(p.Name)) continue;
                var role = p.Type.ToString();
                if (string.Equals(role, "Director", System.StringComparison.OrdinalIgnoreCase))
                {
                    directors.Add(p.Name);
                }
                else if (string.Equals(role, "Actor", System.StringComparison.OrdinalIgnoreCase))
                {
                    if (actors.Count < 5) actors.Add(p.Name);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "[AchievementBadges] GetPeople failed for {ItemId}", item.Id);
        }
        return (directors, actors);
    }

    private static string? GetOriginalLanguage(BaseItem item)
    {
        try
        {
            var prop = item.GetType().GetProperty("OriginalLanguage")
                        ?? item.GetType().GetProperty("PreferredMetadataLanguage");
            if (prop != null)
            {
                var value = prop.GetValue(item) as string;
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }
        }
        catch
        {
        }

        return null;
    }

    private string? ResolveLibraryName(BaseItem item)
    {
        try
        {
            var folders = _libraryManager.GetCollectionFolders(item);
            var name = folders?.FirstOrDefault()?.Name;
            return string.IsNullOrWhiteSpace(name) ? null : name;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "[AchievementBadges] Failed to resolve collection folder for item {ItemId}.", item.Id);
            return null;
        }
    }

    // [v2.1.0 "Open Library", issue #25] Read Genres from the item AND its
    // parent Series (for Episodes). Daemon-Network's anime classification
    // sits on the Series node — Episodes deliver an empty Genres array at
    // playback. Union of (item.Genres ∪ Series.Genres) gives the detector
    // a complete picture. Same reflection-based safety as GetSeriesIdString.
    private static IReadOnlyList<string>? GetEffectiveGenres(BaseItem item)
    {
        var own = item.Genres;
        var parent = TryGetSeriesProperty<string[]>(item, "Genres");
        return UnionStrings(own, parent);
    }

    /// <summary>[v2.1.0 "Open Library", issue #25] Same pattern as
    /// <see cref="GetEffectiveGenres"/> but for Tags. v2.0.x didn't read Tags
    /// at all; many users tag rather than genre-classify their anime.</summary>
    private static IReadOnlyList<string>? GetEffectiveTags(BaseItem item)
    {
        var own = item.Tags;
        var parent = TryGetSeriesProperty<string[]>(item, "Tags");
        return UnionStrings(own, parent);
    }

    /// <summary>[v2.1.0 "Open Library", M2] Safe reflection read of a
    /// string property on a Jellyfin BaseItem (e.g. <c>Album</c>). Different
    /// Jellyfin SDK ABIs expose music metadata fields slightly differently;
    /// reflection lets the same DLL work across versions and avoid hard
    /// compile-time deps on the music-specific subclasses (Audio, AudioBook).
    /// Returns null on any failure — the music tracker treats missing
    /// metadata as "still credit the play, just no album/artist progress".</summary>
    private static string? GetItemString(BaseItem item, string propertyName)
    {
        try
        {
            var prop = item.GetType().GetProperty(propertyName);
            return prop?.GetValue(item) as string;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>[v2.1.0 "Open Library", M2] Same pattern but for string[]
    /// properties (Artists, AlbumArtists). Returns a copy as a readonly list
    /// so the PlaybackContext consumer can't mutate Jellyfin's internal state.</summary>
    private static IReadOnlyList<string>? GetItemStringList(BaseItem item, string propertyName)
    {
        try
        {
            var prop = item.GetType().GetProperty(propertyName);
            if (prop?.GetValue(item) is string[] arr && arr.Length > 0)
            {
                return new List<string>(arr);
            }
        }
        catch
        {
            // best-effort; missing metadata just means no per-artist progress
        }
        return null;
    }

    /// <summary>[v2.1.0 "Open Library"] Best-effort reflection read of a
    /// property on the played item's parent Series (Episode → Series).
    /// Returns null if the item isn't an Episode, the Series accessor
    /// isn't present, or any access throws — anime detection just
    /// falls back to the item's own value in that case.</summary>
    private static T? TryGetSeriesProperty<T>(BaseItem item, string propertyName) where T : class
    {
        try
        {
            var seriesProp = item.GetType().GetProperty("Series");
            if (seriesProp is null) return null;
            var series = seriesProp.GetValue(item);
            if (series is null) return null;
            var targetProp = series.GetType().GetProperty(propertyName);
            return targetProp?.GetValue(series) as T;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>[v2.1.0 "Open Library"] Combine two possibly-null string
    /// arrays, de-dupe case-insensitively, and return a list. Returns null
    /// if both sources are empty so PlaybackContext.Tags / Genres can keep
    /// its v2.0.x nullable shape for callers that gate on null.</summary>
    private static IReadOnlyList<string>? UnionStrings(IReadOnlyList<string>? a, string[]? b)
    {
        if ((a is null || a.Count == 0) && (b is null || b.Length == 0)) return null;
        var set = new System.Collections.Generic.HashSet<string>(System.StringComparer.OrdinalIgnoreCase);
        if (a is not null) foreach (var s in a) if (!string.IsNullOrWhiteSpace(s)) set.Add(s);
        if (b is not null) foreach (var s in b) if (!string.IsNullOrWhiteSpace(s)) set.Add(s);
        return set.Count == 0 ? null : new System.Collections.Generic.List<string>(set);
    }

    // v1.9.3 — Read Episode.SeriesId via reflection to stay version-agnostic
    // (the property has been a stable Guid on Jellyfin's Episode type since
    // 10.7 but reflection avoids a hard cast that could break across abi
    // changes). Returns the canonical "D" format, e.g. 0a1b2c3d-...-...-... .
    private static string? GetSeriesIdString(BaseItem item)
    {
        try
        {
            var prop = item.GetType().GetProperty("SeriesId");
            if (prop?.GetValue(item) is Guid g && g != Guid.Empty)
            {
                return g.ToString("D");
            }
        }
        catch
        {
            // best-effort — pilot/completer credit just won't fire
        }
        return null;
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        GC.SuppressFinalize(this);
        Unsubscribe();
        _disposed = true;
    }
}
