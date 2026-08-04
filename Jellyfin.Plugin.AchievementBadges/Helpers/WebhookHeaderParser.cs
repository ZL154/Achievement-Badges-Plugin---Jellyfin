using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// Parses the admin-configured extra header block for outbound webhook POSTs.
/// Format is one <c>Name: value</c> per line, which is what every other tool
/// that offers this uses, so admins can paste what they already have.
/// </summary>
public static class WebhookHeaderParser
{
    /// <summary>
    /// Split on the first colon only, so values may contain colons (a bearer
    /// token, a URL). Blank lines and <c>#</c> comments are ignored, and
    /// reserved names are dropped rather than silently misapplied.
    /// </summary>
    public static List<(string Name, string Value)> Parse(string? raw)
    {
        var result = new List<(string, string)>();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return result;
        }

        foreach (var line in raw.Split('\n'))
        {
            var trimmed = line.Trim();
            if (trimmed.Length == 0 || trimmed[0] == '#')
            {
                continue;
            }

            var sep = trimmed.IndexOf(':', StringComparison.Ordinal);
            if (sep <= 0)
            {
                continue;
            }

            var name = trimmed[..sep].Trim();
            var value = trimmed[(sep + 1)..].Trim();
            if (name.Length == 0 || IsReserved(name))
            {
                continue;
            }

            result.Add((name, value));
        }

        return result;
    }

    /// <summary>
    /// Names that must not come from this box.
    /// <para>
    /// <c>Content-*</c> belongs to the body: <c>HttpRequestMessage.Headers</c>
    /// silently refuses those, so accepting them here would look like it
    /// worked and quietly do nothing.
    /// </para>
    /// <para>
    /// <c>X-AchievementBadges-*</c> is the signature envelope, so a stray line
    /// cannot forge a signed delivery or overwrite a real signature.
    /// </para>
    /// </summary>
    public static bool IsReserved(string name)
        => name.StartsWith("Content-", StringComparison.OrdinalIgnoreCase)
            || name.StartsWith("X-AchievementBadges-", StringComparison.OrdinalIgnoreCase);
}
