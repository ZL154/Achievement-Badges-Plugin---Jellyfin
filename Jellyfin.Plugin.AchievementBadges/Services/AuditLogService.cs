using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class AuditLogService
{
    public class Entry
    {
        public DateTimeOffset At { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        // Internal flag: true if this entry was stored with username
        // redaction enabled. When reading, UserName is returned as
        // "[redacted]" so it is never leaked to admins.
        public bool Redacted { get; set; } = false;
    }

    private readonly string _path;
    private readonly object _lock = new();
    private readonly JsonSerializerOptions _json = new() { WriteIndented = false };
    private readonly ILogger<AuditLogService> _logger;
    private List<Entry> _entries = new();
    private const int MaxEntries = 5000;

    public AuditLogService(IApplicationPaths applicationPaths, ILogger<AuditLogService> logger)
    {
        _logger = logger;
        var dir = Path.Combine(applicationPaths.PluginConfigurationsPath, "achievementbadges");
        Directory.CreateDirectory(dir);
        _path = Path.Combine(dir, "audit.json");
        Load();
    }

    public void Log(string userId, string userName, string type, string details)
    {
        var redact = Plugin.Instance?.Configuration?.RedactUsernamesInAuditLog ?? false;
        lock (_lock)
        {
            _entries.Add(new Entry
            {
                At = DateTimeOffset.UtcNow,
                UserId = userId ?? string.Empty,
                // Store empty string when redacting so the username is
                // never written to disk.
                UserName = redact ? string.Empty : (userName ?? string.Empty),
                Type = type ?? string.Empty,
                Details = details ?? string.Empty,
                Redacted = redact
            });

            // v1.8.61: in-place trim instead of `Skip+ToList`. The previous
            // implementation allocated a brand-new List<Entry> on every log
            // call once we hit MaxEntries, copying ~5000 references each time.
            // RemoveRange shifts in place — one buffer reuse instead of one
            // allocation per log call.
            if (_entries.Count > MaxEntries)
            {
                _entries.RemoveRange(0, _entries.Count - MaxEntries);
            }

            Save();
        }
    }

    public List<Entry> GetRecent(int limit = 200)
    {
        lock (_lock)
        {
            // v1.8.61: drop OrderByDescending. _entries is already sorted by
            // chronological append order (Log() always appends; trim is FIFO),
            // so the latest `limit` entries are the last `limit` of the list.
            // Walk backwards from the end — O(limit) instead of O(n log n)
            // for sort + O(n) for the Take/Select pipeline.
            var count = _entries.Count;
            var take = Math.Min(limit, count);
            var result = new List<Entry>(take);
            for (var i = count - 1; i >= count - take; i--)
            {
                var e = _entries[i];
                if (e.Redacted)
                {
                    result.Add(new Entry
                    {
                        At = e.At,
                        UserId = e.UserId,
                        UserName = "[redacted]",
                        Type = e.Type,
                        Details = e.Details,
                        Redacted = true
                    });
                }
                else
                {
                    result.Add(e);
                }
            }
            return result;
        }
    }

    private void Load()
    {
        try
        {
            if (!File.Exists(_path)) { _entries = new(); return; }
            var json = File.ReadAllText(_path);
            _entries = JsonSerializer.Deserialize<List<Entry>>(json, _json) ?? new();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[AchievementBadges] Failed to load audit log.");
            _entries = new();
        }
    }

    private void Save()
    {
        try
        {
            var tmp = _path + ".tmp";
            File.WriteAllText(tmp, JsonSerializer.Serialize(_entries, _json));
            File.Move(tmp, _path, overwrite: true);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[AchievementBadges] Failed to save audit log.");
        }
    }
}
