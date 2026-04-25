using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Jellyfin.Plugin.AchievementBadges.Models;

/// <summary>
/// A messaging conversation. Type "dm" = two participants, no editable
/// title, auto-created on first message. Type "group" = 2+ participants,
/// user-named, explicitly created.
/// </summary>
public class Conversation
{
    [JsonPropertyName("id")]              public string   Id              { get; set; } = Guid.NewGuid().ToString("N");
    [JsonPropertyName("type")]            public string   Type            { get; set; } = "dm"; // "dm" | "group"
    [JsonPropertyName("title")]           public string?  Title           { get; set; }
    [JsonPropertyName("participantIds")]  public List<string> ParticipantIds { get; set; } = new();
    [JsonPropertyName("createdAt")]       public DateTime CreatedAt       { get; set; } = DateTime.UtcNow;
    [JsonPropertyName("createdByUserId")] public string   CreatedByUserId { get; set; } = string.Empty;

    /// <summary>
    /// Group admins beyond the creator. Creator is always an implicit admin
    /// and never appears in this list. Empty for DMs.
    /// </summary>
    [JsonPropertyName("adminIds")]        public List<string> AdminIds { get; set; } = new();
}

/// <summary>
/// Attachment metadata. The binary itself is stored on disk under
/// &lt;pluginData&gt;/attachments/&lt;id&gt;.&lt;ext&gt;
/// </summary>
public class Attachment
{
    [JsonPropertyName("id")]              public string   Id              { get; set; } = Guid.NewGuid().ToString("N");
    [JsonPropertyName("uploadedBy")]      public string   UploadedBy      { get; set; } = string.Empty;
    [JsonPropertyName("uploadedAt")]      public DateTime UploadedAt      { get; set; } = DateTime.UtcNow;
    [JsonPropertyName("fileName")]        public string   FileName        { get; set; } = string.Empty;
    [JsonPropertyName("mimeType")]        public string   MimeType        { get; set; } = string.Empty;
    [JsonPropertyName("sizeBytes")]       public long     SizeBytes       { get; set; }
    [JsonPropertyName("width")]           public int?     Width           { get; set; }
    [JsonPropertyName("height")]          public int?     Height          { get; set; }
}
