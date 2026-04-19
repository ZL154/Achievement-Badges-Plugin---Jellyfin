using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Jellyfin.Plugin.AchievementBadges.Models;

/// <summary>
/// One message in a conversation between two friends.
/// </summary>
public class Message
{
    [JsonPropertyName("id")]          public string   Id         { get; set; } = Guid.NewGuid().ToString("N");
    [JsonPropertyName("conversationId")] public string ConversationId { get; set; } = string.Empty;
    [JsonPropertyName("fromUserId")]  public string   FromUserId { get; set; } = string.Empty;
    [JsonPropertyName("fromUserName")]public string   FromUserName { get; set; } = string.Empty;
    /// <summary>For 1:1 only (legacy + convenience). Empty for group messages.</summary>
    [JsonPropertyName("toUserId")]    public string   ToUserId   { get; set; } = string.Empty;
    [JsonPropertyName("text")]        public string   Text       { get; set; } = string.Empty;
    [JsonPropertyName("sentAt")]      public DateTime SentAt     { get; set; } = DateTime.UtcNow;
    /// <summary>
    /// Legacy single-recipient read stamp (kept for backward compatibility
    /// with v1.8.x 1:1 receipts). New code should consult ReadBy for
    /// group-aware receipts.
    /// </summary>
    [JsonPropertyName("readAt")]      public DateTime? ReadAt    { get; set; }
    /// <summary>Per-user read timestamps. userId → when-they-first-read.</summary>
    [JsonPropertyName("readBy")]      public Dictionary<string, DateTime> ReadBy { get; set; } = new();
    /// <summary>Server-side UTC timestamp of the last edit by the sender. Null = not edited.</summary>
    [JsonPropertyName("editedAt")]    public DateTime? EditedAt  { get; set; }
    /// <summary>Optional image attachment ID. Look up via Attachments store.</summary>
    [JsonPropertyName("attachmentId")] public string? AttachmentId { get; set; }
}

/// <summary>
/// On-disk payload: a map from conversation ID to that conversation's
/// messages in chronological order. Conversation ID is
/// <c>min(userA, userB) + "|" + max(userA, userB)</c> (both normalized).
/// </summary>
public class MessagingStore
{
    /// <summary>
    /// messages[conversationId] = chronological list. Key is the
    /// Conversation.Id (a GUID). v1.8.x used pair-derived keys like
    /// "userA|userB"; on first load those are migrated to proper
    /// Conversation records with auto-generated IDs.
    /// </summary>
    [JsonPropertyName("messages")]
    public Dictionary<string, List<Message>> Messages { get; set; } = new();

    /// <summary>Conversation metadata, keyed by conversationId.</summary>
    [JsonPropertyName("convMeta")]
    public Dictionary<string, Conversation> ConvMeta { get; set; } = new();

    /// <summary>Legacy 1.8.x payload kept so upgrades don't lose data.</summary>
    [JsonPropertyName("conversations")]
    public Dictionary<string, List<Message>>? LegacyConversations { get; set; }
}

/// <summary>Per-thread / per-conversation summary row returned to the UI.</summary>
public class ConversationSummary
{
    [JsonPropertyName("conversationId")] public string   ConversationId { get; set; } = string.Empty;
    [JsonPropertyName("type")]           public string   Type           { get; set; } = "dm";
    [JsonPropertyName("title")]          public string?  Title          { get; set; }
    [JsonPropertyName("participants")]   public List<ConversationParticipant> Participants { get; set; } = new();
    [JsonPropertyName("otherUserId")]    public string   OtherUserId    { get; set; } = string.Empty;
    [JsonPropertyName("otherUserName")]  public string   OtherUserName  { get; set; } = string.Empty;
    [JsonPropertyName("lastMessage")]    public string   LastMessage    { get; set; } = string.Empty;
    [JsonPropertyName("lastFromMe")]     public bool     LastFromMe     { get; set; }
    [JsonPropertyName("lastAt")]         public DateTime LastAt         { get; set; }
    [JsonPropertyName("unreadCount")]    public int      UnreadCount    { get; set; }
    [JsonPropertyName("hasAttachment")]  public bool     HasAttachment  { get; set; }
}

public class ConversationParticipant
{
    [JsonPropertyName("userId")]   public string UserId   { get; set; } = string.Empty;
    [JsonPropertyName("userName")] public string UserName { get; set; } = string.Empty;
}

