using MediaBrowser.Controller.Entities;

namespace Jellyfin.Plugin.AchievementBadges.Helpers;

/// <summary>
/// Identity of the media itself, as opposed to the item id Jellyfin happens to
/// be using for it today.
/// <para>
/// Item ids are not stable. Replacing a file, which any *arr does on a quality
/// upgrade, gives Jellyfin a fresh GUID for the same film. Anything keyed by
/// item id alone loses track of it at that moment.
/// </para>
/// </summary>
public static class MediaIdentity
{
    /// <summary>Providers ordered by how reliably they identify this exact
    /// item. Verified against a live library: episodes carry their own Tvdb id,
    /// distinct from one another and from the series, so this cannot collapse a
    /// season into one entry.</summary>
    private static readonly string[] Providers = { "Imdb", "Tmdb", "Tvdb" };

    /// <summary>
    /// A stable key such as <c>Movie|Imdb:tt123</c>, or null when the item has
    /// no provider id. Null is ordinary, not a failure: home video and
    /// unmatched rips have none, and callers fall back to the item id.
    /// </summary>
    public static string? For(BaseItem? item)
    {
        var providers = item?.ProviderIds;
        if (providers is null || providers.Count == 0) return null;

        foreach (var provider in Providers)
        {
            if (providers.TryGetValue(provider, out var value) && !string.IsNullOrWhiteSpace(value))
            {
                // The type prefix keeps two kinds of media apart should they
                // ever be given the same number in different namespaces.
                return item!.GetType().Name + "|" + provider + ":" + value.Trim();
            }
        }

        return null;
    }
}
