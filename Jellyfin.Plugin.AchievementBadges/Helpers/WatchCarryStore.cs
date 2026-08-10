using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

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
/// The same discarding hits a much more ordinary habit: a long episode watched
/// in pieces between other things. A two-hour episode taken in five sittings
/// across a day, or left and resumed two days later, is one viewing to the
/// person watching it, and every sitting but the last was being thrown away.
/// The window is therefore measured in days, and the carry is persisted, since
/// over that span a restart is expected rather than exceptional.
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
        public string UserId { get; set; } = string.Empty;

        public string ItemId { get; set; } = string.Empty;

        /// <summary>
        /// Stable identity of the media itself, such as <c>Movie|Imdb:tt123</c>,
        /// or null when the item carries no provider id. Item ids are not
        /// stable: replacing a file gives Jellyfin a new one. Null entries,
        /// including every entry written before this field existed, still work
        /// by item id alone.
        /// </summary>
        public string? MediaKey { get; set; }

        public long Ticks { get; set; }

        public DateTimeOffset UpdatedAt { get; set; }
    }

    private sealed class CarryFile
    {
        public List<Entry> Entries { get; set; } = new();
    }

    private static readonly JsonSerializerOptions SerializerOptions = new() { WriteIndented = true };

    private readonly ConcurrentDictionary<string, Entry> _entries = new(StringComparer.OrdinalIgnoreCase);
    private readonly TimeSpan _window;
    private readonly string? _persistPath;
    private readonly object _fileLock = new();

    /// <summary>
    /// Creates a store. The default window is seven days: long enough for an
    /// item taken up over several evenings, short enough that an unrelated
    /// viewing weeks later starts clean. Pass <paramref name="persistPath"/> to
    /// keep the carry across restarts.
    /// </summary>
    public WatchCarryStore(TimeSpan? window = null, string? persistPath = null)
    {
        _window = window ?? TimeSpan.FromDays(7);
        _persistPath = persistPath;
        Load();
    }

    /// <summary>Number of entries currently held. Diagnostics and tests.</summary>
    public int Count => _entries.Count;

    /// <summary>
    /// Why the last read or write of the carry file failed, or null when the
    /// last one succeeded. Callers surface this instead of the store swallowing
    /// it: a persistence layer that fails quietly loses data without anyone
    /// noticing, which is the very failure this store exists to prevent.
    /// </summary>
    public string? LastPersistError { get; private set; }

    private static string Key(string userId, string itemId) => userId + "|" + itemId;

    /// <summary>
    /// Ticks carried for this user and item, or zero when there is nothing
    /// recent. Expired entries are dropped on the way through, which keeps the
    /// store bounded without a background timer.
    /// </summary>
    public long Peek(string userId, string itemId, DateTimeOffset now, string? mediaKey = null)
    {
        Prune(now);

        var total = 0L;

        if (_entries.TryGetValue(Key(userId, itemId), out var entry)
            && now - entry.UpdatedAt <= _window)
        {
            total = entry.Ticks;
        }

        // Same media, different item id. An *arr quality upgrade replaces the
        // file and Jellyfin mints a new GUID, so everything banked against the
        // old one becomes unreachable while the viewer keeps watching the same
        // film. Measured on a live server: 69.6 minutes stranded under a dead
        // id, 34.8 minutes under the live one, and a finished 95 minute film
        // refused at 36%.
        //
        // Added rather than used as a fallback, because the live id usually
        // does have an entry, so a fallback would never fire in the case this
        // exists for. Double counting is not a concern: Remember folds the
        // older entries away as soon as this total is written back.
        if (!string.IsNullOrEmpty(mediaKey))
        {
            foreach (var pair in _entries)
            {
                var other = pair.Value;
                if (!string.Equals(other.MediaKey, mediaKey, StringComparison.OrdinalIgnoreCase)) continue;
                if (!string.Equals(other.UserId, userId, StringComparison.OrdinalIgnoreCase)) continue;
                if (string.Equals(other.ItemId, itemId, StringComparison.OrdinalIgnoreCase)) continue;
                if (now - other.UpdatedAt > _window) continue;

                total += other.Ticks;
            }
        }

        return total;
    }

    /// <summary>
    /// Records ticks watched but not credited. Replaces any previous value,
    /// because the caller passes the running total for the item, not a delta.
    /// Non-positive values clear the entry instead of storing a useless one.
    /// </summary>
    public void Remember(string userId, string itemId, long ticks, DateTimeOffset now, string? mediaKey = null)
    {
        if (ticks <= 0)
        {
            Clear(userId, itemId, mediaKey);
            return;
        }

        _entries[Key(userId, itemId)] = new Entry
        {
            UserId = userId,
            ItemId = itemId,
            MediaKey = mediaKey,
            Ticks = ticks,
            UpdatedAt = now
        };

        // The caller passes the running total, which Peek already folded the
        // older ids into, so keeping them would count that time twice on the
        // next sitting. Consolidating here is what makes the addition in Peek
        // safe.
        ForEachSiblingOf(userId, itemId, mediaKey, key => _entries.TryRemove(key, out _));

        Persist();
    }

    /// <summary>
    /// Runs an action for every entry that is the same media as this one under
    /// a different item id. No-op when the item has no stable media key.
    /// </summary>
    private void ForEachSiblingOf(string userId, string itemId, string? mediaKey, Action<string> action)
    {
        if (string.IsNullOrEmpty(mediaKey)) return;

        foreach (var pair in _entries)
        {
            var other = pair.Value;
            if (!string.Equals(other.MediaKey, mediaKey, StringComparison.OrdinalIgnoreCase)) continue;
            if (!string.Equals(other.UserId, userId, StringComparison.OrdinalIgnoreCase)) continue;
            if (string.Equals(other.ItemId, itemId, StringComparison.OrdinalIgnoreCase)) continue;

            action(pair.Key);
        }
    }

    /// <summary>
    /// Drops the carry, called once the item has been credited. Also drops the
    /// same media held under other item ids, so a credited film cannot leave an
    /// orphan behind that resurfaces against a later re-watch.
    /// </summary>
    public void Clear(string userId, string itemId, string? mediaKey = null)
    {
        var removed = _entries.TryRemove(Key(userId, itemId), out _);

        ForEachSiblingOf(userId, itemId, mediaKey, key => removed |= _entries.TryRemove(key, out _));

        if (removed)
        {
            Persist();
        }
    }

    /// <summary>
    /// Fills in the media key of entries written before the field existed, and
    /// reports how many could not be resolved.
    /// <para>
    /// Without this an upgrade only protects viewings started after it. Every
    /// partial viewing already on disk keeps its bare item id, so a file
    /// replaced tomorrow strands it exactly as before. Resolving them at
    /// startup, while their items are still in the library, is the difference
    /// between fixing this going forward and fixing it for the people who
    /// already have time banked.
    /// </para>
    /// <para>
    /// An entry whose item no longer resolves is already lost and nothing here
    /// can recover it: the old code stored the item id and nothing else, so
    /// after the item is gone there is nothing left to match it to. Those are
    /// counted and returned so the caller can say so out loud rather than let
    /// the time disappear quietly, which is how this was missed in the first
    /// place.
    /// </para>
    /// </summary>
    /// <param name="resolve">Maps an item id to a media key, or null when the
    /// item is gone or carries no provider id.</param>
    /// <returns>How many were filled in, and how many could not be.</returns>
    public (int Filled, int Unresolved) BackfillMediaKeys(Func<string, string?> resolve)
    {
        ArgumentNullException.ThrowIfNull(resolve);

        var filled = 0;
        var unresolved = 0;

        foreach (var pair in _entries)
        {
            var entry = pair.Value;
            if (!string.IsNullOrEmpty(entry.MediaKey)) continue;

            string? key;
            try
            {
                key = resolve(entry.ItemId);
            }
            catch (Exception)
            {
                // One unreadable item must not abort the whole backfill and
                // leave the rest unprotected.
                unresolved++;
                continue;
            }

            if (string.IsNullOrEmpty(key))
            {
                unresolved++;
                continue;
            }

            entry.MediaKey = key;
            filled++;
        }

        if (filled > 0)
        {
            Persist();
        }

        return (filled, unresolved);
    }

    private void Prune(DateTimeOffset now)
    {
        var removed = false;
        foreach (var pair in _entries)
        {
            if (now - pair.Value.UpdatedAt > _window)
            {
                removed |= _entries.TryRemove(pair.Key, out _);
            }
        }

        if (removed)
        {
            Persist();
        }
    }

    private void Load()
    {
        if (string.IsNullOrWhiteSpace(_persistPath) || !File.Exists(_persistPath))
        {
            return;
        }

        try
        {
            CarryFile? file;
            lock (_fileLock)
            {
                file = JsonSerializer.Deserialize<CarryFile>(File.ReadAllText(_persistPath));
            }

            if (file?.Entries is null)
            {
                return;
            }

            var now = DateTimeOffset.UtcNow;
            foreach (var entry in file.Entries)
            {
                // An entry that expired while the server was down must not come
                // back to life just because it was on disk.
                if (entry is null
                    || entry.Ticks <= 0
                    || string.IsNullOrWhiteSpace(entry.UserId)
                    || string.IsNullOrWhiteSpace(entry.ItemId)
                    || now - entry.UpdatedAt > _window)
                {
                    continue;
                }

                _entries[Key(entry.UserId, entry.ItemId)] = entry;
            }

            LastPersistError = null;
        }
        catch (Exception ex)
        {
            // A carry file we cannot read costs partial viewings, not data the
            // user owns, so starting empty is the right call. It is reported
            // rather than hidden, and the next write replaces the bad file.
            LastPersistError = "read " + _persistPath + ": " + ex.Message;
        }
    }

    private void Persist()
    {
        if (string.IsNullOrWhiteSpace(_persistPath))
        {
            return;
        }

        try
        {
            var file = new CarryFile();
            foreach (var pair in _entries)
            {
                file.Entries.Add(pair.Value);
            }

            var json = JsonSerializer.Serialize(file, SerializerOptions);

            lock (_fileLock)
            {
                var directory = Path.GetDirectoryName(_persistPath);
                if (!string.IsNullOrEmpty(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                // Written aside and moved into place so a shutdown mid-write
                // cannot leave a truncated file to be discarded on boot.
                var temporary = _persistPath + ".tmp";
                File.WriteAllText(temporary, json);
                File.Move(temporary, _persistPath, overwrite: true);
            }

            LastPersistError = null;
        }
        catch (Exception ex)
        {
            LastPersistError = "write " + _persistPath + ": " + ex.Message;
        }
    }
}
