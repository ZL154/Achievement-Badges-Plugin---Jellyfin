using System;
using System.Collections.Generic;
using System.Linq;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Session;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// One-sided follow model: users add other users as friends and see their
/// online/offline status, equipped badges, and current now-playing item.
/// Bi-directional friendship is implicit — if B also adds A, the UI can
/// show them as a mutual friend.
///
/// Online state + now-playing comes from Jellyfin's ISessionManager, not
/// from our own profile, so it stays live without polling our JSON.
/// </summary>
public class FriendsService
{
    private readonly AchievementBadgeService _badgeService;
    private readonly ISessionManager _sessionManager;
    private readonly IUserManager _userManager;

    public FriendsService(AchievementBadgeService badgeService, ISessionManager sessionManager, IUserManager userManager)
    {
        _badgeService = badgeService;
        _sessionManager = sessionManager;
        _userManager = userManager;
    }

    public object ListFriends(string userId)
    {
        userId = NormalizeId(userId);
        var profile = _badgeService.PeekProfile(userId);
        if (profile == null) return new List<object>();

        var myFriends = (profile.Friends ?? new List<string>()).Select(NormalizeId).Distinct().ToList();
        if (myFriends.Count == 0) return new List<object>();

        // Build a map of active sessions keyed by UserId so we can enrich
        // friend entries with online status + now-playing in a single pass.
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
        catch { /* session manager unavailable — fall through, everyone offline */ }

        var rows = new List<FriendRow>();
        foreach (var fid in myFriends)
        {
            var fProfile = _badgeService.PeekProfile(fid);
            var userName = ResolveUserName(fid);
            var equipped = GetEquippedPreview(fid, fProfile);
            var isOnline = sessionByUser.TryGetValue(fid, out var session) && session.IsActive;
            object? nowPlaying = null;
            if (isOnline && session?.NowPlayingItem != null)
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
            var lastSeen = session?.LastActivityDate;
            var mutual = fProfile?.Friends != null && fProfile.Friends.Any(x => NormalizeId(x) == userId);
            rows.Add(new FriendRow
            {
                UserId = fid,
                UserName = userName,
                Online = isOnline,
                LastSeen = lastSeen,
                Equipped = equipped,
                NowPlaying = nowPlaying,
                Mutual = mutual
            });
        }
        return rows
            .OrderByDescending(x => x.Online)
            .ThenBy(x => x.UserName ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .Cast<object>()
            .ToList();
    }

    private class FriendRow
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public bool Online { get; set; }
        public DateTime? LastSeen { get; set; }
        public List<object> Equipped { get; set; } = new();
        public object? NowPlaying { get; set; }
        public bool Mutual { get; set; }
    }

    public (bool ok, string message) AddFriend(string userId, string friendUserId)
    {
        userId = NormalizeId(userId);
        friendUserId = NormalizeId(friendUserId);
        if (userId == friendUserId) return (false, "Can't add yourself.");
        if (!Guid.TryParse(friendUserId, out var friendGuid)) return (false, "Invalid friend id.");
        try
        {
            if (_userManager.GetUserById(friendGuid) is null) return (false, "User not found.");
        }
        catch
        {
            return (false, "User not found.");
        }

        var profile = _badgeService.GetOrCreateProfileDirect(userId);
        profile.Friends ??= new List<string>();
        if (profile.Friends.Any(x => NormalizeId(x) == friendUserId)) return (true, "Already friends.");
        if (profile.Friends.Count >= 200) return (false, "Friend list is full (200 max).");
        profile.Friends.Add(friendUserId);
        _badgeService.SaveProfileDirect(profile);
        return (true, "Added.");
    }

    public (bool ok, string message) RemoveFriend(string userId, string friendUserId)
    {
        userId = NormalizeId(userId);
        friendUserId = NormalizeId(friendUserId);
        var profile = _badgeService.PeekProfile(userId);
        if (profile == null) return (true, "Not friends.");
        profile.Friends ??= new List<string>();
        var before = profile.Friends.Count;
        profile.Friends = profile.Friends.Where(x => NormalizeId(x) != friendUserId).ToList();
        if (profile.Friends.Count != before) _badgeService.SaveProfileDirect(profile);
        return (true, "Removed.");
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

    private List<object> GetEquippedPreview(string userId, Models.UserAchievementProfile? profile)
    {
        // Share the same privacy logic as the public equipped endpoint —
        // service already respects HideFromLeaderboard/HideFromCompare/
        // ShowEquippedShowcase + admin force-hide.
        return _badgeService.GetPublicEquippedPreview(userId);
    }
}
