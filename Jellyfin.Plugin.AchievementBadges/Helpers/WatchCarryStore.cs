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

        _entries[Key(userId, itemId)] = new Entry
        {
            UserId = userId,
            ItemId = itemId,
            Ticks = ticks,
            UpdatedAt = now
        };

        Persist();
    }

    /// <summary>Drops the carry, called once the item has been credited.</summary>
    public void Clear(string userId, string itemId)
    {
        if (_entries.TryRemove(Key(userId, itemId), out _))
        {
            Persist();
        }
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
