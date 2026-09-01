using System;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// [issue #107] Identity of a targeted badge's subject, carried in
/// <c>MetricParameter</c> as <c>"{guid:N}|{display name}"</c>.
/// <para>
/// Both halves are stored because each covers the other's failure mode. A
/// GUID does not survive an item being deleted and re-added, which is routine
/// after a mass rename upstream of Jellyfin; a name does not survive a rename
/// and is ambiguous across same-titled items. Resolution tries the GUID, then
/// the name, and rewrites the GUID when the name wins.
/// </para>
/// <para>
/// The split is on the FIRST separator, so a display name containing a pipe
/// keeps it. Splitting on the last one would truncate the name and break the
/// fallback lookup precisely when the GUID has already gone stale.
/// </para>
/// </summary>
public static class TargetRef
{
    public const char Separator = '|';

    public static string Format(Guid id, string? name)
    {
        return id.ToString("N") + Separator + (name ?? string.Empty);
    }

    public static bool TryParse(string? raw, out Guid id, out string name)
    {
        id = Guid.Empty;
        name = string.Empty;

        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        var trimmed = raw.Trim();
        var cut = trimmed.IndexOf(Separator);
        if (cut < 0)
        {
            name = trimmed;
            return true;
        }

        var head = trimmed.Substring(0, cut);
        var tail = trimmed.Substring(cut + 1);

        if (Guid.TryParse(head, out var parsed))
        {
            id = parsed;
            name = tail;
        }
        else
        {
            // Not a GUID in front: the whole value is a name that happens to
            // contain the separator.
            name = trimmed;
        }

        return true;
    }

    /// <summary>
    /// Counter-dictionary key for this parameter, or null when the parameter
    /// has no GUID yet. Null means "not resolved", which reads as zero
    /// progress rather than as an error: the next recompute resolves the name
    /// and rewrites the parameter with its GUID.
    /// </summary>
    public static string? KeyOf(string? raw)
    {
        return TryParse(raw, out var id, out _) && id != Guid.Empty
            ? id.ToString("N")
            : null;
    }
}
