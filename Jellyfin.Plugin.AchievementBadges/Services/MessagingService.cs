using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// Xbox-style messaging. v1.8.2 extends to full conversations
/// (1:1 DMs + named groups of 2+ members) and image attachments.
///
/// Messages live in a single JSON file on disk, keyed by conversation
/// ID. Friendship is still required for DM participants; group creators
/// must be friends with every initial participant. Blocked users' messages
/// are silently dropped; conversations they share with blockers remain
/// visible but send is rejected.
/// </summary>
public class MessagingService
{
    internal const int MaxTextLength                 = 1000;
    internal const int MaxMessagesPerConversation    = 2000;
    internal const int RateLimitMessagesPerMinute    = 20;
    internal const int MaxGroupParticipants          = 20;
    internal const long MaxAttachmentBytes           = 8L * 1024 * 1024;  // 8 MB images
    internal static readonly TimeSpan EditWindow     = TimeSpan.FromHours(24);
    internal static readonly HashSet<string> AllowedAttachmentMimes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png", "image/jpeg", "image/gif", "image/webp"
    };

    private readonly FriendsService _friends;
    private readonly AchievementBadgeService _badgeService;
    private readonly IUserManager _userManager;
    private readonly ILogger<MessagingService> _logger;

    private readonly object _lock = new();
    private readonly string _dataFilePath;
    private readonly string _attachmentsDir;
    private readonly string _attachmentsIndexPath;
    private MessagingStore _store = new();
    private Dictionary<string, Attachment> _attachments = new();

    private readonly ConcurrentDictionary<string, Queue<DateTime>> _rateWindow = new();

    public MessagingService(
        IApplicationPaths applicationPaths,
        FriendsService friends,
        AchievementBadgeService badgeService,
        IUserManager userManager,
        ILogger<MessagingService> logger)
    {
        _friends = friends;
        _badgeService = badgeService;
        _userManager = userManager;
        _logger = logger;

        var pluginDataPath = Path.Combine(applicationPaths.PluginConfigurationsPath, "achievementbadges");
        Directory.CreateDirectory(pluginDataPath);
        _dataFilePath = Path.Combine(pluginDataPath, "messages.json");
        _attachmentsDir = Path.Combine(pluginDataPath, "attachments");
        Directory.CreateDirectory(_attachmentsDir);
        _attachmentsIndexPath = Path.Combine(pluginDataPath, "attachments.json");
        Load();
    }

    // ══════════════════════════════════════════════════════════════════
    // Conversations
    // ══════════════════════════════════════════════════════════════════

    /// <summary>
    /// Returns (or auto-creates) the 1:1 conversation between two users.
    /// </summary>
    public Conversation GetOrCreateDm(string meId, string otherId)
    {
        meId = NormalizeId(meId);
        otherId = NormalizeId(otherId);
        lock (_lock)
        {
            var existing = _store.ConvMeta.Values
                .FirstOrDefault(c => c.Type == "dm" &&
                                     c.ParticipantIds.Count == 2 &&
                                     c.ParticipantIds.Any(p => NormalizeId(p) == meId) &&
                                     c.ParticipantIds.Any(p => NormalizeId(p) == otherId));
            if (existing != null) return existing;

            var c = new Conversation
            {
                Type = "dm",
                ParticipantIds = new List<string> { meId, otherId },
                CreatedByUserId = meId
            };
            _store.ConvMeta[c.Id] = c;
            Save();
            return c;
        }
    }

    public (bool ok, string? error, Conversation? conv) CreateGroup(string creatorId, string? title, List<string> participantIds)
    {
        creatorId = NormalizeId(creatorId);
        var ids = (participantIds ?? new List<string>())
            .Select(NormalizeId).Where(s => !string.IsNullOrEmpty(s)).Distinct().ToList();
        if (!ids.Contains(creatorId)) ids.Insert(0, creatorId);
        if (ids.Count < 3) return (false, "Group chat needs at least 3 members (you + 2).", null);
        if (ids.Count > MaxGroupParticipants) return (false, $"Group capped at {MaxGroupParticipants} members.", null);
        foreach (var pid in ids)
        {
            if (pid == creatorId) continue;
            if (!_friends.AreMutualFriends(creatorId, pid))
                return (false, "You can only add friends to a group.", null);
            if (IsEitherBlocked(creatorId, pid))
                return (false, "One or more members block/are blocked.", null);
        }
        var conv = new Conversation
        {
            Type = "group",
            Title = string.IsNullOrWhiteSpace(title) ? null : title.Trim(),
            ParticipantIds = ids,
            CreatedByUserId = creatorId
        };
        lock (_lock)
        {
            _store.ConvMeta[conv.Id] = conv;
            Save();
        }
        return (true, null, conv);
    }

    public (bool ok, string? error) AddGroupMember(string callerId, string convId, string newUserId)
    {
        callerId = NormalizeId(callerId);
        newUserId = NormalizeId(newUserId);
        lock (_lock)
        {
            if (!_store.ConvMeta.TryGetValue(convId, out var conv)) return (false, "Conversation not found.");
            if (conv.Type != "group") return (false, "Can only add members to group chats.");
            if (!conv.ParticipantIds.Any(p => NormalizeId(p) == callerId)) return (false, "You're not in this group.");
            if (conv.ParticipantIds.Any(p => NormalizeId(p) == newUserId)) return (true, null);
            if (conv.ParticipantIds.Count >= MaxGroupParticipants) return (false, $"Group is full ({MaxGroupParticipants}).");
            if (!_friends.AreMutualFriends(callerId, newUserId))
                return (false, "You can only add your own friends.");
            conv.ParticipantIds.Add(newUserId);
            Save();
        }
        return (true, null);
    }

    public (bool ok, string? error) LeaveOrRemoveGroup(string callerId, string convId, string targetUserId)
    {
        callerId = NormalizeId(callerId);
        targetUserId = NormalizeId(targetUserId);
        lock (_lock)
        {
            if (!_store.ConvMeta.TryGetValue(convId, out var conv)) return (false, "Conversation not found.");
            if (conv.Type != "group") return (false, "Can only modify group membership.");
            if (!conv.ParticipantIds.Any(p => NormalizeId(p) == callerId)) return (false, "You're not in this group.");
            // Caller can leave (target=self) or if creator, remove anyone.
            if (targetUserId != callerId && !string.Equals(NormalizeId(conv.CreatedByUserId), callerId))
                return (false, "Only the group creator can remove others.");
            conv.ParticipantIds.RemoveAll(p => NormalizeId(p) == targetUserId);
            if (conv.ParticipantIds.Count < 2)
            {
                _store.ConvMeta.Remove(conv.Id);
                _store.Messages.Remove(conv.Id);
            }
            Save();
        }
        return (true, null);
    }

    public (bool ok, string? error) RenameGroup(string callerId, string convId, string? newTitle)
    {
        callerId = NormalizeId(callerId);
        lock (_lock)
        {
            if (!_store.ConvMeta.TryGetValue(convId, out var conv)) return (false, "Conversation not found.");
            if (conv.Type != "group") return (false, "Can only rename group chats.");
            if (!conv.ParticipantIds.Any(p => NormalizeId(p) == callerId)) return (false, "Not a member.");
            conv.Title = string.IsNullOrWhiteSpace(newTitle) ? null : newTitle.Trim();
            Save();
        }
        return (true, null);
    }

    public Conversation? GetConversation(string callerId, string convId)
    {
        callerId = NormalizeId(callerId);
        lock (_lock)
        {
            if (!_store.ConvMeta.TryGetValue(convId, out var conv)) return null;
            if (!conv.ParticipantIds.Any(p => NormalizeId(p) == callerId)) return null;
            return conv;
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // Send / fetch / mark-read
    // ══════════════════════════════════════════════════════════════════

    public (bool ok, string? error, Message? message) SendToConversation(
        string callerId, string callerName, string convId, string text, string? attachmentId)
    {
        callerId = NormalizeId(callerId);
        text = (text ?? string.Empty).Trim();
        var hasAttachment = !string.IsNullOrEmpty(attachmentId);
        if (!hasAttachment && string.IsNullOrWhiteSpace(text)) return (false, "Message is empty.", null);
        if (text.Length > MaxTextLength) return (false, $"Message exceeds {MaxTextLength} character limit.", null);

        Conversation? conv;
        lock (_lock) { _store.ConvMeta.TryGetValue(convId, out conv); }
        if (conv == null) return (false, "Conversation not found.", null);
        if (!conv.ParticipantIds.Any(p => NormalizeId(p) == callerId)) return (false, "Not a participant.", null);

        // For DMs, enforce friendship + block.
        if (conv.Type == "dm")
        {
            var other = NormalizeId(conv.ParticipantIds.First(p => NormalizeId(p) != callerId));
            if (!_friends.AreMutualFriends(callerId, other)) return (false, "You can only message friends.", null);
            if (IsEitherBlocked(callerId, other))             return (false, "Message could not be delivered.", null);
        }

        if (!CheckAndRecordRate(callerId))
            return (false, $"Rate limit: max {RateLimitMessagesPerMinute} messages per minute.", null);

        // Verify attachment belongs to caller and exists
        if (hasAttachment)
        {
            lock (_lock)
            {
                if (!_attachments.TryGetValue(attachmentId!, out var att))
                    return (false, "Attachment not found.", null);
                if (NormalizeId(att.UploadedBy) != callerId)
                    return (false, "Attachment does not belong to you.", null);
            }
        }

        var msg = new Message
        {
            ConversationId = conv.Id,
            FromUserId = callerId,
            FromUserName = string.IsNullOrWhiteSpace(callerName) ? ResolveUserName(callerId) : callerName,
            ToUserId = conv.Type == "dm" ? NormalizeId(conv.ParticipantIds.First(p => NormalizeId(p) != callerId)) : string.Empty,
            Text = text,
            SentAt = DateTime.UtcNow,
            AttachmentId = hasAttachment ? attachmentId : null
        };

        lock (_lock)
        {
            if (!_store.Messages.TryGetValue(conv.Id, out var list))
            {
                list = new List<Message>();
                _store.Messages[conv.Id] = list;
            }
            list.Add(msg);
            if (list.Count > MaxMessagesPerConversation)
                list.RemoveRange(0, list.Count - MaxMessagesPerConversation);
            Save();
        }
        return (true, null, msg);
    }

    /// <summary>
    /// Returns the last N messages in a conversation, chronological,
    /// and marks the caller's inbound messages as read.
    /// </summary>
    public List<Message> GetConversationMessages(string callerId, string convId, int limit = 200)
    {
        callerId = NormalizeId(callerId);
        lock (_lock)
        {
            if (!_store.ConvMeta.TryGetValue(convId, out var conv)) return new List<Message>();
            if (!conv.ParticipantIds.Any(p => NormalizeId(p) == callerId)) return new List<Message>();
            if (!_store.Messages.TryGetValue(conv.Id, out var list) || list.Count == 0) return new List<Message>();

            if (limit <= 0 || limit > list.Count) limit = list.Count;
            var slice = list.Skip(list.Count - limit).ToList();

            var changed = false;
            foreach (var m in list)
            {
                if (NormalizeId(m.FromUserId) == callerId) continue;
                // Legacy single-field ReadAt still set for DMs to remain backward-compatible with v1.8.x clients
                if (m.ReadAt == null) { m.ReadAt = DateTime.UtcNow; changed = true; }
                m.ReadBy ??= new Dictionary<string, DateTime>();
                if (!m.ReadBy.ContainsKey(callerId))
                {
                    m.ReadBy[callerId] = DateTime.UtcNow;
                    changed = true;
                }
            }
            if (changed) Save();
            return slice;
        }
    }

    public int GetUnreadCount(string callerId)
    {
        callerId = NormalizeId(callerId);
        lock (_lock)
        {
            var count = 0;
            foreach (var (convId, list) in _store.Messages)
            {
                if (!_store.ConvMeta.TryGetValue(convId, out var conv)) continue;
                if (!conv.ParticipantIds.Any(p => NormalizeId(p) == callerId)) continue;
                foreach (var m in list)
                {
                    if (NormalizeId(m.FromUserId) == callerId) continue;
                    var readByMe = m.ReadBy != null && m.ReadBy.ContainsKey(callerId);
                    if (!readByMe && m.ReadAt == null) count++;
                    else if (!readByMe && m.ReadAt != null && conv.Type == "dm" && NormalizeId(m.ToUserId) != callerId) count++;
                }
            }
            return count;
        }
    }

    public List<ConversationSummary> GetThreads(string callerId)
    {
        callerId = NormalizeId(callerId);
        var summaries = new List<ConversationSummary>();
        lock (_lock)
        {
            foreach (var (convId, conv) in _store.ConvMeta)
            {
                if (!conv.ParticipantIds.Any(p => NormalizeId(p) == callerId)) continue;
                _store.Messages.TryGetValue(convId, out var list);
                list ??= new List<Message>();
                if (list.Count == 0 && conv.Type == "dm") continue; // don't surface empty DMs

                Message? last = list.Count > 0 ? list[^1] : null;
                var others = conv.ParticipantIds
                    .Where(p => NormalizeId(p) != callerId)
                    .Select(p => new ConversationParticipant
                    {
                        UserId = NormalizeId(p),
                        UserName = ResolveUserName(p)
                    })
                    .ToList();
                var primaryOther = others.FirstOrDefault();
                var unread = 0;
                foreach (var m in list)
                {
                    if (NormalizeId(m.FromUserId) == callerId) continue;
                    var readByMe = m.ReadBy != null && m.ReadBy.ContainsKey(callerId);
                    if (!readByMe && m.ReadAt == null) unread++;
                    else if (!readByMe && conv.Type == "dm" && NormalizeId(m.ToUserId) == callerId && m.ReadAt == null) unread++;
                }

                var lastTitleText = last?.Text ?? string.Empty;
                if (string.IsNullOrEmpty(lastTitleText) && !string.IsNullOrEmpty(last?.AttachmentId)) lastTitleText = "[image]";

                summaries.Add(new ConversationSummary
                {
                    ConversationId = conv.Id,
                    Type = conv.Type,
                    Title = conv.Title,
                    Participants = others,
                    OtherUserId = primaryOther?.UserId ?? string.Empty,
                    OtherUserName = conv.Type == "group"
                        ? (conv.Title ?? string.Join(", ", others.Select(o => o.UserName)))
                        : primaryOther?.UserName ?? string.Empty,
                    LastMessage = lastTitleText,
                    LastFromMe = last != null && NormalizeId(last.FromUserId) == callerId,
                    LastAt = last?.SentAt ?? conv.CreatedAt,
                    UnreadCount = unread,
                    HasAttachment = !string.IsNullOrEmpty(last?.AttachmentId)
                });
            }
        }
        summaries.Sort((a, b) => b.LastAt.CompareTo(a.LastAt));
        return summaries;
    }

    // ══════════════════════════════════════════════════════════════════
    // Edit / delete / clear (unchanged semantics, operate on conv)
    // ══════════════════════════════════════════════════════════════════

    public (bool ok, string? error, Message? message) EditMessage(string callerId, string messageId, string newText)
    {
        callerId = NormalizeId(callerId);
        newText = (newText ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(newText)) return (false, "Message is empty.", null);
        if (newText.Length > MaxTextLength)     return (false, $"Message exceeds {MaxTextLength} character limit.", null);

        lock (_lock)
        {
            foreach (var list in _store.Messages.Values)
            {
                for (var i = 0; i < list.Count; i++)
                {
                    var m = list[i];
                    if (m.Id != messageId) continue;
                    if (NormalizeId(m.FromUserId) != callerId) return (false, "You can only edit your own messages.", null);
                    if ((DateTime.UtcNow - m.SentAt) > EditWindow)
                        return (false, "Edit window has passed (24 hours).", null);
                    m.Text = newText;
                    m.EditedAt = DateTime.UtcNow;
                    Save();
                    return (true, null, m);
                }
            }
        }
        return (false, "Message not found.", null);
    }

    public (bool ok, string? error) DeleteMessage(string callerId, string messageId)
    {
        callerId = NormalizeId(callerId);
        lock (_lock)
        {
            foreach (var list in _store.Messages.Values)
            {
                for (var i = 0; i < list.Count; i++)
                {
                    if (list[i].Id != messageId) continue;
                    if (NormalizeId(list[i].FromUserId) != callerId) return (false, "You can only delete your own messages.");
                    var att = list[i].AttachmentId;
                    list.RemoveAt(i);
                    if (!string.IsNullOrEmpty(att)) TryDeleteAttachment(att);
                    Save();
                    return (true, null);
                }
            }
        }
        return (false, "Message not found.");
    }

    public (bool ok, int deleted) ClearConversation(string callerId, string convId)
    {
        callerId = NormalizeId(callerId);
        lock (_lock)
        {
            if (!_store.ConvMeta.TryGetValue(convId, out var conv)) return (true, 0);
            if (!conv.ParticipantIds.Any(p => NormalizeId(p) == callerId)) return (false, 0);
            if (!_store.Messages.TryGetValue(convId, out var list)) return (true, 0);
            var count = list.Count;
            foreach (var m in list) if (!string.IsNullOrEmpty(m.AttachmentId)) TryDeleteAttachment(m.AttachmentId);
            _store.Messages[convId] = new List<Message>();
            Save();
            return (true, count);
        }
    }

    /// <summary>
    /// Backwards-compat DM clear (keyed by other user id) — 1.8.1 clients
    /// still call this path. Resolves to the pair's DM conversation.
    /// </summary>
    public (bool ok, int deleted) ClearDmByOtherUser(string callerId, string otherUserId)
    {
        var conv = GetOrCreateDm(callerId, otherUserId);
        return ClearConversation(callerId, conv.Id);
    }

    // ══════════════════════════════════════════════════════════════════
    // Block
    // ══════════════════════════════════════════════════════════════════

    public (bool ok, string? error) BlockUser(string callerId, string otherId)
    {
        callerId = NormalizeId(callerId); otherId = NormalizeId(otherId);
        if (callerId == otherId) return (false, "Can't block yourself.");
        var profile = _badgeService.GetOrCreateProfileDirect(callerId);
        profile.Preferences ??= new UserNotificationPreferences();
        profile.Preferences.BlockedUsers ??= new List<string>();
        if (!profile.Preferences.BlockedUsers.Any(x => NormalizeId(x) == otherId))
        {
            profile.Preferences.BlockedUsers.Add(otherId);
            _badgeService.SaveProfileDirect(profile);
        }
        return (true, null);
    }

    public (bool ok, string? error) UnblockUser(string callerId, string otherId)
    {
        callerId = NormalizeId(callerId); otherId = NormalizeId(otherId);
        var profile = _badgeService.GetOrCreateProfileDirect(callerId);
        if (profile.Preferences?.BlockedUsers != null)
        {
            profile.Preferences.BlockedUsers.RemoveAll(x => NormalizeId(x) == otherId);
            _badgeService.SaveProfileDirect(profile);
        }
        return (true, null);
    }

    public List<string> GetBlockedUsers(string callerId)
    {
        callerId = NormalizeId(callerId);
        var p = _badgeService.PeekProfile(callerId);
        return p?.Preferences?.BlockedUsers?.Select(NormalizeId).Distinct().ToList() ?? new List<string>();
    }

    private bool IsEitherBlocked(string a, string b)
    {
        a = NormalizeId(a); b = NormalizeId(b);
        var pa = _badgeService.PeekProfile(a);
        var pb = _badgeService.PeekProfile(b);
        bool aHasB = pa?.Preferences?.BlockedUsers?.Any(x => NormalizeId(x) == b) == true;
        bool bHasA = pb?.Preferences?.BlockedUsers?.Any(x => NormalizeId(x) == a) == true;
        return aHasB || bHasA;
    }

    // ══════════════════════════════════════════════════════════════════
    // Attachments
    // ══════════════════════════════════════════════════════════════════

    public (bool ok, string? error, Attachment? att) SaveAttachment(string callerId, string fileName, string mimeType, byte[] bytes, int? width, int? height)
    {
        callerId = NormalizeId(callerId);
        if (bytes == null || bytes.Length == 0) return (false, "Empty file.", null);
        if (bytes.Length > MaxAttachmentBytes) return (false, $"File exceeds {MaxAttachmentBytes / (1024 * 1024)}MB limit.", null);
        if (!AllowedAttachmentMimes.Contains(mimeType)) return (false, "Unsupported file type.", null);
        if (!VerifyImageMagic(mimeType, bytes)) return (false, "File content does not match declared type.", null);

        var att = new Attachment
        {
            UploadedBy = callerId,
            FileName = string.IsNullOrWhiteSpace(fileName) ? "image" : SafeFileName(fileName),
            MimeType = mimeType,
            SizeBytes = bytes.Length,
            Width = width,
            Height = height
        };

        var ext = mimeType switch
        {
            "image/png"  => ".png",
            "image/jpeg" => ".jpg",
            "image/gif"  => ".gif",
            "image/webp" => ".webp",
            _ => ".bin"
        };
        var path = Path.Combine(_attachmentsDir, att.Id + ext);
        try { File.WriteAllBytes(path, bytes); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AB] SaveAttachment: write failed for {Id}", att.Id);
            return (false, "Could not save file.", null);
        }

        lock (_lock)
        {
            _attachments[att.Id] = att;
            SaveAttachmentsIndex();
        }
        return (true, null, att);
    }

    public (Attachment att, byte[] bytes)? LoadAttachment(string attachmentId)
    {
        lock (_lock)
        {
            if (!_attachments.TryGetValue(attachmentId, out var att)) return null;
            var ext = att.MimeType switch
            {
                "image/png"  => ".png",
                "image/jpeg" => ".jpg",
                "image/gif"  => ".gif",
                "image/webp" => ".webp",
                _ => ".bin"
            };
            var path = Path.Combine(_attachmentsDir, attachmentId + ext);
            if (!File.Exists(path)) return null;
            try { return (att, File.ReadAllBytes(path)); }
            catch { return null; }
        }
    }

    private void TryDeleteAttachment(string attachmentId)
    {
        if (!_attachments.TryGetValue(attachmentId, out var att)) return;
        var ext = att.MimeType switch
        {
            "image/png"  => ".png",
            "image/jpeg" => ".jpg",
            "image/gif"  => ".gif",
            "image/webp" => ".webp",
            _ => ".bin"
        };
        var path = Path.Combine(_attachmentsDir, attachmentId + ext);
        try { if (File.Exists(path)) File.Delete(path); } catch { }
        _attachments.Remove(attachmentId);
        SaveAttachmentsIndex();
    }

    /// <summary>
    /// Magic-byte sniff to make sure the uploaded file really is what
    /// the mime type claims. Prevents "image/png" rename smuggling.
    /// </summary>
    private static bool VerifyImageMagic(string mime, byte[] b)
    {
        if (b.Length < 8) return false;
        if (mime == "image/png") return b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47;
        if (mime == "image/jpeg") return b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF;
        if (mime == "image/gif") return b[0] == 0x47 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x38;
        if (mime == "image/webp")
            return b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46 &&
                   b[8] == 0x57 && b[9] == 0x45 && b[10] == 0x42 && b[11] == 0x50;
        return false;
    }

    private static string SafeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(name.Select(c => invalid.Contains(c) ? '_' : c).ToArray());
        if (cleaned.Length > 80) cleaned = cleaned[..80];
        return cleaned;
    }

    // ══════════════════════════════════════════════════════════════════
    // Internals
    // ══════════════════════════════════════════════════════════════════

    private bool CheckAndRecordRate(string senderId)
    {
        var now = DateTime.UtcNow;
        var q = _rateWindow.GetOrAdd(senderId, _ => new Queue<DateTime>());
        lock (q)
        {
            while (q.Count > 0 && (now - q.Peek()).TotalSeconds > 60) q.Dequeue();
            if (q.Count >= RateLimitMessagesPerMinute) return false;
            q.Enqueue(now);
            return true;
        }
    }

    private string ResolveUserName(string userId)
    {
        try
        {
            var user = _userManager.Users.FirstOrDefault(u =>
                u.Id.ToString("N").Equals(userId, StringComparison.OrdinalIgnoreCase));
            if (user != null) return user.Username;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "[AB] MessagingService: user-name resolve failed for {User}", userId);
        }
        return userId;
    }

    private static string NormalizeId(string? id)
    {
        if (string.IsNullOrWhiteSpace(id)) return string.Empty;
        var s = id.Trim();
        if (Guid.TryParse(s, out var g)) return g.ToString("N");
        return s.ToLowerInvariant();
    }

    // ══════════════════════════════════════════════════════════════════
    // Persistence
    // ══════════════════════════════════════════════════════════════════

    private void Load()
    {
        try
        {
            if (File.Exists(_dataFilePath))
            {
                var json = File.ReadAllText(_dataFilePath);
                _store = JsonSerializer.Deserialize<MessagingStore>(json) ?? new MessagingStore();
            }
            MigrateLegacyIfNeeded();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AB] MessagingService: load failed — starting empty");
            _store = new MessagingStore();
        }

        try
        {
            if (File.Exists(_attachmentsIndexPath))
            {
                var json = File.ReadAllText(_attachmentsIndexPath);
                _attachments = JsonSerializer.Deserialize<Dictionary<string, Attachment>>(json) ?? new();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AB] MessagingService: attachment index load failed");
            _attachments = new Dictionary<string, Attachment>();
        }
    }

    /// <summary>
    /// Convert pre-1.8.2 store, where messages were keyed by
    /// "userA|userB", into the new conversation-keyed format.
    /// </summary>
    private void MigrateLegacyIfNeeded()
    {
        if (_store.LegacyConversations == null || _store.LegacyConversations.Count == 0) return;
        _logger.LogInformation("[AB] MessagingService: migrating {N} legacy conversations to conversation model", _store.LegacyConversations.Count);
        foreach (var (pairKey, list) in _store.LegacyConversations)
        {
            var parts = pairKey.Split('|');
            if (parts.Length != 2 || list == null || list.Count == 0) continue;
            var a = NormalizeId(parts[0]);
            var b = NormalizeId(parts[1]);
            var conv = new Conversation
            {
                Type = "dm",
                ParticipantIds = new List<string> { a, b },
                CreatedByUserId = a,
                CreatedAt = list[0].SentAt
            };
            _store.ConvMeta[conv.Id] = conv;
            foreach (var m in list) m.ConversationId = conv.Id;
            _store.Messages[conv.Id] = list;
        }
        _store.LegacyConversations = null;
        Save();
    }

    private void Save()
    {
        try
        {
            var tmp = _dataFilePath + ".tmp";
            var json = JsonSerializer.Serialize(_store);
            File.WriteAllText(tmp, json);
            File.Move(tmp, _dataFilePath, overwrite: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AB] MessagingService: save failed");
        }
    }

    private void SaveAttachmentsIndex()
    {
        try
        {
            var tmp = _attachmentsIndexPath + ".tmp";
            var json = JsonSerializer.Serialize(_attachments);
            File.WriteAllText(tmp, json);
            File.Move(tmp, _attachmentsIndexPath, overwrite: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AB] MessagingService: attachment index save failed");
        }
    }
}
