using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// Remembers which Tracearr plays have already been credited to each user.
/// <para>
/// The scan can credit blindly because it resets the profile first: it writes
/// onto counters that were just wiped. A standalone sync has nothing wiping
/// anything, so without a record of what was already counted, pressing the
/// button twice credits every play twice. Rewatch counts double, totals
/// inflate, and there is no way back except the reset that loses everything
/// else. This is that record.
/// </para>
/// <para>
/// Keyed by user and by Tracearr's own play id, which is stable across calls,
/// so the same play is recognised no matter how the history is paged.
/// </para>
/// </summary>
public sealed class TracearrCreditLedger
{
    private sealed class FileShape
    {
        public Dictionary<string, List<string>> CreditedByUser { get; set; } = new();
    }

    private static readonly JsonSerializerOptions SerializerOptions = new() { WriteIndented = false };

    private readonly ConcurrentDictionary<string, HashSet<string>> _byUser =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly string? _persistPath;
    private readonly object _fileLock = new();

    /// <summary>Last write failure, or null. Surfaced rather than thrown: a
    /// ledger that cannot be written must not take a working sync down with
    /// it, but silently forgetting would reintroduce double crediting, so the
    /// caller needs to be able to see it.</summary>
    public string? LastPersistError { get; private set; }

    public TracearrCreditLedger(string? persistPath = null)
    {
        _persistPath = persistPath;
        Load();
    }

    /// <summary>Play ids already credited to this user.</summary>
    public IReadOnlySet<string> For(string userId)
    {
        return _byUser.TryGetValue(Key(userId), out var set)
            ? set
            : (IReadOnlySet<string>)new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>Records ids as credited. Returns how many were new, so a
    /// caller can report "nothing to do" honestly instead of claiming work it
    /// did not perform.</summary>
    public int Remember(string userId, IEnumerable<string> playIds)
    {
        if (playIds is null) return 0;

        var set = _byUser.GetOrAdd(Key(userId), static _ => new HashSet<string>(StringComparer.OrdinalIgnoreCase));
        var added = 0;

        lock (set)
        {
            foreach (var id in playIds)
            {
                if (!string.IsNullOrWhiteSpace(id) && set.Add(id)) added++;
            }
        }

        if (added > 0) Persist();
        return added;
    }

    /// <summary>
    /// Drops everything remembered for a user. Called when their profile is
    /// reset: after a reset those plays genuinely do need crediting again, so
    /// keeping the ledger would leave the user permanently missing them. This
    /// is what makes the design correct rather than merely safe against
    /// double clicks.
    /// </summary>
    public void Forget(string userId)
    {
        if (_byUser.TryRemove(Key(userId), out _)) Persist();
    }

    private static string Key(string? userId)
        => (userId ?? string.Empty).Replace("-", string.Empty, StringComparison.Ordinal).ToLowerInvariant();

    private void Load()
    {
        if (string.IsNullOrEmpty(_persistPath) || !File.Exists(_persistPath)) return;

        try
        {
            var file = JsonSerializer.Deserialize<FileShape>(File.ReadAllText(_persistPath));
            if (file?.CreditedByUser is null) return;

            foreach (var pair in file.CreditedByUser)
            {
                _byUser[Key(pair.Key)] = new HashSet<string>(pair.Value ?? new List<string>(), StringComparer.OrdinalIgnoreCase);
            }
        }
        catch (Exception ex)
        {
            // A corrupt ledger reads as "nothing credited yet". That risks one
            // round of double crediting, which is bad, but refusing to start
            // is worse, and the alternative of guessing is not available.
            LastPersistError = "read " + _persistPath + ": " + ex.Message;
        }
    }

    private void Persist()
    {
        if (string.IsNullOrEmpty(_persistPath)) return;

        try
        {
            var file = new FileShape();
            foreach (var pair in _byUser)
            {
                lock (pair.Value)
                {
                    file.CreditedByUser[pair.Key] = new List<string>(pair.Value);
                }
            }

            var json = JsonSerializer.Serialize(file, SerializerOptions);

            lock (_fileLock)
            {
                var directory = Path.GetDirectoryName(_persistPath);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);

                // Written aside and moved into place, so a shutdown mid-write
                // cannot leave a truncated ledger that reads as "nothing
                // credited" and re-credits everything on the next sync.
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
