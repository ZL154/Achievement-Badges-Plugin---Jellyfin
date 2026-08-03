using System;
using System.Collections.Concurrent;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// Remembers watch time that ended a session without being credited, keyed by
/// user and item, so the next session for the same item continues from it.
/// <para>
/// The per-session accumulator in <c>PlaybackCompletionTracker</c> is keyed by
/// Jellyfin's session id, and a stream that drops and reconnects is handed a
/// brand new one, so everything watched before the break was discarded. That
/// is not an edge case: when a transcode stalls, the client stops and restarts
/// on its own within seconds, which the viewer experiences as buffering rather
/// than an interruption. An episode watched end to end could therefore be
/// measured as two halves, neither one reaching the credit threshold, and no
/// credit was given for a full viewing.
/// </para>
/// <para>
/// This does not weaken the anti-abuse gate. Only genuinely advanced playback
/// time is ever accumulated, because seeks are excluded before the ticks get
/// here; the carry expires after the window; and it is dropped as soon as the
/// item is credited, so a later re-watch starts from zero.
/// </para>
/// </summary>
public sealed class WatchCarryStore
{
    private sealed class Entry
    {
        public long Ticks;
        public DateTimeOffset UpdatedAt;
    }

    private readonly ConcurrentDictionary<string, Entry> _entries = new(StringComparer.OrdinalIgnoreCase);
    private readonly TimeSpan _window;

    /// <summary>
    /// Creates a store. The default window is six hours: long enough to cover
    /// a viewing interrupted by repeated reconnects, short enough that an
    /// unrelated viewing days later starts clean.
    /// </summary>
    public WatchCarryStore(TimeSpan? window = null)
    {
        _window = window ?? TimeSpan.FromHours(6);
    }

    /// <summary>Number of entries currently held. Diagnostics and tests.</summary>
    public int Count => _entries.Count;

    private static string Key(string userId, string itemId) => userId + "|" + itemId;

    /// <summary>
    /// Ticks carried for this user and item, or zero when there is nothing
    /// recent. Expired entries are dropped on the way through, which keeps the
    /// store bounded without a background timer.
    /// </summary>
    public long Peek(string userId, string itemId, DateTimeOffset now)
    {
        Prune(now);

        if (_entries.TryGetValue(Key(userId, itemId), out var entry)
            && now - entry.UpdatedAt <= _window)
        {
            return entry.Ticks;
        }

        return 0;
    }

    /// <summary>
    /// Records ticks watched but not credited. Replaces any previous value,
    /// because the caller passes the running total for the item, not a delta.
    /// Non-positive values clear the entry instead of storing a useless one.
    /// </summary>
    public void Remember(string userId, string itemId, long ticks, DateTimeOffset now)
    {
        if (ticks <= 0)
        {
            Clear(userId, itemId);
            return;
        }

        _entries[Key(userId, itemId)] = new Entry { Ticks = ticks, UpdatedAt = now };
    }

    /// <summary>Drops the carry, called once the item has been credited.</summary>
    public void Clear(string userId, string itemId)
    {
        _entries.TryRemove(Key(userId, itemId), out _);
    }

    private void Prune(DateTimeOffset now)
    {
        foreach (var pair in _entries)
        {
            if (now - pair.Value.UpdatedAt > _window)
            {
                _entries.TryRemove(pair.Key, out _);
            }
        }
    }
}
