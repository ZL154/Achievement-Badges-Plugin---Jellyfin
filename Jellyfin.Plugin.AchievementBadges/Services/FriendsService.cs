using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Data.Enums;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Session;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Querying;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// Bi-directional friendship model with request/accept flow.
/// - POST users/{A}/friends/{B}           → A requests friendship with B
/// - POST users/{B}/friends/{A}/accept    → B accepts the request; mutual
/// - DELETE users/{U}/friends/{O}         → removes from both sides
///                                          (or declines a pending request)
///
/// Online state + now-playing comes from Jellyfin's ISessionManager, not our
/// own profile store, so it stays live without polling our JSON.
/// </summary>
public class FriendsService
{
    private readonly AchievementBadgeService _badgeService;
    private readonly ISessionManager _sessionManager;
    private readonly IUserManager _userManager;
    private readonly ILibraryManager _libraryManager;
    private readonly IUserDataManager _userDataManager;

    public FriendsService(
        AchievementBadgeService badgeService,
        ISessionManager sessionManager,
        IUserManager userManager,
        ILibraryManager libraryManager,
        IUserDataManager userDataManager)
    {
        _badgeService = badgeService;
        _sessionManager = sessionManager;
        _userManager = userManager;
        _libraryManager = libraryManager;
        _userDataManager = userDataManager;
    }

    /// <summary>
    /// v1.8.57: in-memory cache for LastWatched results. Without this, the
    /// /users/{userId}/friends endpoint was running one 50-item library
    /// query + 50 reflection-based UserData lookups per friend on every
    /// call — N+1 per page-load, plus periodic re-fetches from sidebar.js.
    /// 90s TTL is short enough that a freshly-played item shows up quickly
    /// and long enough that repeated drawer opens / 30s badge polls don't
    /// keep hitting the library.
    /// </summary>
    private static readonly ConcurrentDictionary<Guid, (DateTime At, object? Value)> _lastWatchedCache = new();
    private static readonly TimeSpan _lastWatchedTtl = TimeSpan.FromSeconds(90);

    /// <summary>
    /// Invalidate the cached LastWatched for a single user. Called from the
    /// playback completion path (PlaybackCompletionService / Tracker) so a
    /// fresh play immediately replaces the cached entry on next read.
    /// Public + static so external services can invalidate without holding
    /// a FriendsService reference.
    /// </summary>
    public static void InvalidateLastWatched(Guid userId)
    {
        _lastWatchedCache.TryRemove(userId, out _);
    }

    /// <summary>
    /// v1.8.54: get the most recently played media item for a user. Used to
    /// power the "Offline — &lt;last watched&gt;" line in the friends drawer
    /// so offline rows mirror the "Watching X" treatment online rows get.
    /// Avoids SortOrder enum (namespace shifts between Jellyfin minor
    /// releases) by fetching a bounded batch of played items and sorting
    /// in C# via the reflection-based GetUserData.LastPlayedDate pattern
    /// already used by WatchHistoryBackfillService. Falls back to null on
    /// any exception so one bad library never breaks a friends listing.
    /// </summary>
    private object? GetLastWatched(Guid userId)
    {
        // v1.8.57: serve from cache when fresh.
        if (_lastWatchedCache.TryGetValue(userId, out var cached)
            && (DateTime.UtcNow - cached.At) < _lastWatchedTtl)
        {
            return cached.Value;
        }

        var computed = ComputeLastWatched(userId);
        _lastWatchedCache[userId] = (DateTime.UtcNow, computed);
        return computed;
    }

    private object? ComputeLastWatched(Guid userId)
    {
        try
        {
            var user = _userManager.GetUserById(userId);
            if (user is null) return null;
            // v1.9.2: bump Limit to 500 (was 50). Without an OrderBy we get
            // whatever 500 played items the underlying query returns; the
            // C# pass below picks the highest LastPlayedDate among them.
            // 50 was too small for users with thousands of plays — the
            // "most recent of arbitrary 50" was not actually the most
            // recently played item. With the 90s LastWatched cache one
            // call per friend per 90s, the higher Limit costs nothing
            // observable in practice.
            var query = new InternalItemsQuery(user)
            {
                IncludeItemTypes = new[] { BaseItemKind.Movie, BaseItemKind.Episode },
                IsPlayed = true,
                Limit = 500,
                Recursive = true,
                EnableTotalRecordCount = false
            };
            var result = _libraryManager.GetItemsResult(query);
            var items = result?.Items;
            if (items is null || items.Count == 0) return null;

            BaseItem? best = null;
            DateTime bestPlayed = DateTime.MinValue;
            foreach (var item in items)
            {
                var played = GetLastPlayed(user, item);
                if (played > bestPlayed)
                {
                    bestPlayed = played;
                    best = item;
                }
            }
            if (best is null) return null;
            return new
            {
                Id = best.Id.ToString("N"),
                Name = best.Name,
                Type = best.GetBaseItemKind().ToString(),
                SeriesName = (best as MediaBrowser.Controller.Entities.TV.Episode)?.SeriesName,
                SeasonName = (best as MediaBrowser.Controller.Entities.TV.Episode)?.SeasonName
            };
        }
        catch
        {
            return null;
        }
    }

    private DateTime GetLastPlayed(object user, BaseItem item)
    {
        try
        {
            var method = _userDataManager.GetType().GetMethod("GetUserData",
                new[] { user.GetType(), typeof(BaseItem) });
            if (method == null) return DateTime.MinValue;
            var userData = method.Invoke(_userDataManager, new[] { user, item });
            if (userData == null) return DateTime.MinValue;
            var prop = userData.GetType().GetProperty("LastPlayedDate");
            var val = prop?.GetValue(userData) as DateTime?;
            return val ?? DateTime.MinValue;
        }
        catch
        {
            return DateTime.MinValue;
        }
    }

    public object List(string userId)
    {
        userId = NormalizeId(userId);
        var profile = _badgeService.PeekProfile(userId);
        var cfg = Plugin.Instance?.Configuration;
        var simpleMode = cfg?.FriendsSimpleMode == true;

        // One session lookup for everyone — used for Online / NowPlaying.
        var sessionByUser = new Dictionary<string, SessionInfo>(StringComparer.OrdinalIgnoreCase);
        try
        {
            foreach (var s in _sessionManager.Sessions)
            {
                if (s == null) continue;
                var sid = s.UserId.ToString("N");
                if (!sessionByUser.ContainsKey(sid)) sessionByUser[sid] = s;
            }
        }
        catch { /* live status unavailable; everyone offline */ }

        // Admin "simple" mode: instead of the friend list, return every
        // user on the server so admins running small family servers don't
        // need to go through the request/accept flow.
        List<FriendRow> friends;
        if (simpleMode)
        {
            try
            {
                friends = _userManager.Users
                    .Where(u => u != null)
                    .Select(u => u.Id.ToString("N"))
                    .Where(uid => !string.Equals(uid, userId, StringComparison.OrdinalIgnoreCase))
                    .Select(uid => BuildFriendRow(userId, uid, sessionByUser))
                    .OrderByDescending(x => x.Online)
                    .ThenBy(x => x.UserName ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }
            catch
            {
                friends = new List<FriendRow>();
            }
            return new
            {
                Friends = friends.Cast<object>().ToList(),
                Incoming = new List<object>(),
                Outgoing = new List<object>(),
                SimpleMode = true
            };
        }

        if (profile == null)
        {
            return new { Friends = new List<object>(), Incoming = new List<object>(), Outgoing = new List<object>() };
        }

        friends = (profile.Friends ?? new List<string>())
            .Select(NormalizeId).Distinct()
            .Select(fid => BuildFriendRow(userId, fid, sessionByUser))
            .OrderByDescending(x => x.Online)
            .ThenBy(x => x.UserName ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var incoming = (profile.FriendRequestsReceived ?? new List<string>())
            .Select(NormalizeId).Distinct()
            .Select(fid => new { UserId = fid, UserName = ResolveUserName(fid) })
            .ToList();

        var outgoing = (profile.FriendRequestsSent ?? new List<string>())
            .Select(NormalizeId).Distinct()
            .Select(fid => new { UserId = fid, UserName = ResolveUserName(fid) })
            .ToList();

        return new
        {
            Friends = friends.Cast<object>().ToList(),
            Incoming = incoming,
            Outgoing = outgoing,
            SimpleMode = false
        };
    }

    private FriendRow BuildFriendRow(string userId, string fid, Dictionary<string, SessionInfo> sessionByUser)
    {
        var fProfile = _badgeService.PeekProfile(fid);
        var userName = ResolveUserName(fid);
        var equipped = _badgeService.GetPublicEquippedPreview(fid);
        sessionByUser.TryGetValue(fid, out var session);
        // Relaxed online check: Jellyfin's `SessionInfo.IsActive` is tied to
        // active playback controllers, so an idle-logged-in user flips to
        // inactive quickly — which meant friends never showed as "Online"
        // unless they were actively playing. Now we ALSO treat a session
        // seen within the last ~15 min as online (via LastActivityDate)
        // so "just browsing Jellyfin" counts.
        var recentlyActive = session != null &&
                             (DateTime.UtcNow - session.LastActivityDate.ToUniversalTime()).TotalMinutes < 15;
        var isOnline = session != null && (session.IsActive || recentlyActive);

        // Respect the target's friend-visibility prefs — AppearOffline makes
        // them look offline, HideNowPlaying keeps them online but hides
        // what they're watching.
        var appearOffline = fProfile?.Preferences?.AppearOffline == true;
        var hideNowPlaying = fProfile?.Preferences?.HideNowPlaying == true;
        if (appearOffline) isOnline = false;

        object? nowPlaying = null;
        if (isOnline && !hideNowPlaying && session?.NowPlayingItem != null)
        {
            var item = session.NowPlayingItem;
            nowPlaying = new
            {
                Id = item.Id.ToString("N"),
                Name = item.Name,
                Type = item.Type.ToString(),
                SeriesName = item.SeriesName,
                SeasonName = item.SeasonName
            };
        }
        // v1.8.54: surface the friend's most recently played item when they're
        // offline — mirrors the online "Watching X" line. Suppressed entirely
        // when AppearOffline / HideNowPlaying / HideLastWatched (v1.8.56) is
        // set, same privacy contract as NowPlaying. Skipped when online too
        // (NowPlaying takes precedence).
        var hideLastWatched = fProfile?.Preferences?.HideLastWatched == true;
        object? lastWatched = null;
        if (!isOnline && !appearOffline && !hideNowPlaying && !hideLastWatched
            && Guid.TryParseExact(fid, "N", out var fGuid))
        {
            lastWatched = GetLastWatched(fGuid);
        }

        return new FriendRow
        {
            UserId = fid,
            UserName = userName,
            Online = isOnline,
            // When the user appears offline, don't leak a LastSeen date either.
            LastSeen = appearOffline ? null : session?.LastActivityDate,
            Equipped = equipped,
            NowPlaying = nowPlaying,
            LastWatched = lastWatched
        };
    }

    /// <summary>
    /// Send a friend request from <paramref name="userId"/> to
    /// <paramref name="targetUserId"/>. If the target already sent us a
    /// request, this auto-accepts and creates a mutual friendship.
    /// </summary>
    public (bool ok, string message) SendRequest(string userId, string targetUserId)
    {
        userId = NormalizeId(userId);
        targetUserId = NormalizeId(targetUserId);
        if (userId == targetUserId) return (false, "Can't add yourself.");
        if (!Guid.TryParse(targetUserId, out var targetGuid)) return (false, "Invalid user id.");
        try
        {
            if (_userManager.GetUserById(targetGuid) is null) return (false, "User not found.");
        }
        catch
        {
            return (false, "User not found.");
        }

        var caller = _badgeService.GetOrCreateProfileDirect(userId);
        var target = _badgeService.GetOrCreateProfileDirect(targetUserId);

        caller.Friends ??= new List<string>();
        caller.FriendRequestsSent ??= new List<string>();
        target.FriendRequestsReceived ??= new List<string>();

        if (caller.Friends.Any(x => NormalizeId(x) == targetUserId)) return (true, "Already friends.");

        // If target has already requested us, auto-accept into mutual.
        caller.FriendRequestsReceived ??= new List<string>();
        if (caller.FriendRequestsReceived.Any(x => NormalizeId(x) == targetUserId))
        {
            return Accept(userId, targetUserId);
        }

        if (caller.FriendRequestsSent.Any(x => NormalizeId(x) == targetUserId)) return (true, "Request already sent.");
        if (caller.FriendRequestsSent.Count >= 200) return (false, "Outgoing request list is full.");
        if (target.FriendRequestsReceived.Count >= 200) return (false, "Target has too many pending requests.");

        caller.FriendRequestsSent.Add(targetUserId);
        target.FriendRequestsReceived.Add(userId);
        _badgeService.SaveProfileDirect(caller);
        _badgeService.SaveProfileDirect(target);
        return (true, "Request sent.");
    }

    public (bool ok, string message) Accept(string userId, string otherUserId)
    {
        userId = NormalizeId(userId);
        otherUserId = NormalizeId(otherUserId);
        if (userId == otherUserId) return (false, "Invalid.");

        var me = _badgeService.GetOrCreateProfileDirect(userId);
        var other = _badgeService.GetOrCreateProfileDirect(otherUserId);
        me.Friends ??= new List<string>();
        other.Friends ??= new List<string>();
        me.FriendRequestsReceived ??= new List<string>();
        me.FriendRequestsSent ??= new List<string>();
        other.FriendRequestsReceived ??= new List<string>();
        other.FriendRequestsSent ??= new List<string>();

        // Only accept if a request actually exists from the other side, to
        // stop a caller from adding themselves to someone else's Friends list
        // by forging an accept.
        var hasIncoming = me.FriendRequestsReceived.Any(x => NormalizeId(x) == otherUserId);
        if (!hasIncoming) return (false, "No pending request from that user.");

        me.FriendRequestsReceived = me.FriendRequestsReceived.Where(x => NormalizeId(x) != otherUserId).ToList();
        other.FriendRequestsSent = other.FriendRequestsSent.Where(x => NormalizeId(x) != userId).ToList();

        if (!me.Friends.Any(x => NormalizeId(x) == otherUserId)) me.Friends.Add(otherUserId);
        if (!other.Friends.Any(x => NormalizeId(x) == userId)) other.Friends.Add(userId);

        _badgeService.SaveProfileDirect(me);
        _badgeService.SaveProfileDirect(other);
        return (true, "Accepted.");
    }

    /// <summary>
    /// Remove friendship AND clear any pending requests in either direction.
    /// Used for unfriend, decline-incoming, and cancel-outgoing.
    /// </summary>
    public (bool ok, string message) Remove(string userId, string otherUserId)
    {
        userId = NormalizeId(userId);
        otherUserId = NormalizeId(otherUserId);
        var me = _badgeService.PeekProfile(userId);
        var other = _badgeService.PeekProfile(otherUserId);
        var changed = false;

        if (me != null)
        {
            if (me.Friends != null)
            {
                var before = me.Friends.Count;
                me.Friends = me.Friends.Where(x => NormalizeId(x) != otherUserId).ToList();
                if (me.Friends.Count != before) changed = true;
            }
            if (me.FriendRequestsSent != null)
            {
                var before = me.FriendRequestsSent.Count;
                me.FriendRequestsSent = me.FriendRequestsSent.Where(x => NormalizeId(x) != otherUserId).ToList();
                if (me.FriendRequestsSent.Count != before) changed = true;
            }
            if (me.FriendRequestsReceived != null)
            {
                var before = me.FriendRequestsReceived.Count;
                me.FriendRequestsReceived = me.FriendRequestsReceived.Where(x => NormalizeId(x) != otherUserId).ToList();
                if (me.FriendRequestsReceived.Count != before) changed = true;
            }
            if (changed) _badgeService.SaveProfileDirect(me);
        }

        if (other != null)
        {
            var otherChanged = false;
            if (other.Friends != null)
            {
                var before = other.Friends.Count;
                other.Friends = other.Friends.Where(x => NormalizeId(x) != userId).ToList();
                if (other.Friends.Count != before) otherChanged = true;
            }
            if (other.FriendRequestsSent != null)
            {
                var before = other.FriendRequestsSent.Count;
                other.FriendRequestsSent = other.FriendRequestsSent.Where(x => NormalizeId(x) != userId).ToList();
                if (other.FriendRequestsSent.Count != before) otherChanged = true;
            }
            if (other.FriendRequestsReceived != null)
            {
                var before = other.FriendRequestsReceived.Count;
                other.FriendRequestsReceived = other.FriendRequestsReceived.Where(x => NormalizeId(x) != userId).ToList();
                if (other.FriendRequestsReceived.Count != before) otherChanged = true;
            }
            if (otherChanged) _badgeService.SaveProfileDirect(other);
        }
        return (true, "Removed.");
    }

    /// <summary>
    /// Returns true only when both users have the other in their Friends
    /// list. Used as the gate for features that require an accepted
    /// friendship (messaging, etc.), where a pending request or one-sided
    /// storage state would be wrong.
    /// </summary>
    public bool AreMutualFriends(string userIdA, string userIdB)
    {
        userIdA = NormalizeId(userIdA);
        userIdB = NormalizeId(userIdB);
        if (string.IsNullOrEmpty(userIdA) || string.IsNullOrEmpty(userIdB)) return false;
        if (userIdA == userIdB) return false;

        // Simple mode skips the explicit friendship step — every user on
        // the server is treated as a "friend" of every other. Keep that
        // behaviour consistent here so messaging works in simple mode too.
        var cfg = Plugin.Instance?.Configuration;
        if (cfg?.FriendsSimpleMode == true) return true;

        var a = _badgeService.PeekProfile(userIdA);
        var b = _badgeService.PeekProfile(userIdB);
        if (a == null || b == null) return false;

        var aHasB = (a.Friends ?? new List<string>()).Any(x => NormalizeId(x) == userIdB);
        var bHasA = (b.Friends ?? new List<string>()).Any(x => NormalizeId(x) == userIdA);
        return aHasB && bHasA;
    }

    private static string NormalizeId(string? id)
    {
        if (string.IsNullOrWhiteSpace(id)) return string.Empty;
        var s = id.Trim();
        if (Guid.TryParse(s, out var g)) return g.ToString("N");
        return s.ToLowerInvariant();
    }

    private string ResolveUserName(string userId)
    {
        try
        {
            if (Guid.TryParse(userId, out var g))
            {
                var u = _userManager.GetUserById(g);
                if (u != null) return u.Username;
            }
        }
        catch { }
        return "Unknown";
    }

    private class FriendRow
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public bool Online { get; set; }
        public DateTime? LastSeen { get; set; }
        public List<object> Equipped { get; set; } = new();
        public object? NowPlaying { get; set; }
        // v1.8.54: most recent played item when user is offline (privacy-gated).
        public object? LastWatched { get; set; }
    }
}
