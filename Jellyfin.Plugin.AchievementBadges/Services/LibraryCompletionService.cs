using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Data.Enums;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class LibraryCompletionService
{
    private readonly ILibraryManager _libraryManager;
    private readonly IUserManager _userManager;
    private readonly AchievementBadgeService _badgeService;
    private readonly ILogger<LibraryCompletionService> _logger;

    public LibraryCompletionService(
        ILibraryManager libraryManager,
        IUserManager userManager,
        AchievementBadgeService badgeService,
        ILogger<LibraryCompletionService> logger)
    {
        _libraryManager = libraryManager;
        _userManager = userManager;
        _badgeService = badgeService;
        _logger = logger;
    }

    public Dictionary<string, int> RecomputeForUser(Guid userGuid)
    {
        var result = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var user = _userManager.GetUserById(userGuid);
        if (user is null)
        {
            return result;
        }

        try
        {
            var folders = _libraryManager.GetUserRootFolder().GetChildren(user, true)
                .OfType<Folder>()
                .ToList();

            foreach (var folder in folders)
            {
                try
                {
                    var totalQuery = new InternalItemsQuery(user)
                    {
                        IncludeItemTypes = new[] { BaseItemKind.Movie, BaseItemKind.Episode },
                        AncestorIds = new[] { folder.Id },
                        Recursive = true,
                        EnableTotalRecordCount = false
                    };

                    var total = _libraryManager.GetItemsResult(totalQuery).Items.Count;
                    if (total == 0) continue;

                    var playedQuery = new InternalItemsQuery(user)
                    {
                        IncludeItemTypes = new[] { BaseItemKind.Movie, BaseItemKind.Episode },
                        AncestorIds = new[] { folder.Id },
                        IsPlayed = true,
                        Recursive = true,
                        EnableTotalRecordCount = false
                    };

                    var played = _libraryManager.GetItemsResult(playedQuery).Items.Count;
                    var percent = (int)Math.Round(100.0 * played / total);
                    var name = folder.Name ?? string.Empty;
                    if (!string.IsNullOrWhiteSpace(name))
                    {
                        result[name] = percent;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "[AchievementBadges] Library completion calc failed for {Folder}", folder.Name);
                }
            }
        }
        catch (Exception ex)
        {
            // Return without writing: this method replaces the stored map, so
            // persisting the partial result of a failed enumeration would wipe
            // percentages that are still true. An empty result from a
            // successful enumeration (no libraries) is legitimate and still
            // written below.
            _logger.LogWarning(ex, "[AchievementBadges] Library completion recompute failed for user {UserId}", userGuid);
            return result;
        }

        _badgeService.UpdateLibraryCompletionPercents(userGuid.ToString("D"), result);
        return result;
    }

    /// <summary>
    /// [issue #79] Discography completion per artist: played tracks over the
    /// artist's tracks in this user's libraries.
    /// <para>
    /// Counted on album artist rather than on every credited artist, because a
    /// guest appearance is not part of someone's discography. Counted on
    /// tracks rather than albums, matching how the rest of the music metrics
    /// already work and avoiding the question of what a compilation or a
    /// single does to an album-based percentage.
    /// </para>
    /// <para>
    /// Artists with a single track are skipped. Their percentage is only ever
    /// 0 or 100, so they would hand out a "completed an artist" badge for one
    /// play, which is not what the badge means.
    /// </para>
    /// </summary>
    public Dictionary<string, int> RecomputeArtistsForUser(Guid userGuid)
    {
        var result = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var user = _userManager.GetUserById(userGuid);
        if (user is null)
        {
            return result;
        }

        try
        {
            var artistQuery = new InternalItemsQuery(user)
            {
                IncludeItemTypes = new[] { BaseItemKind.MusicArtist },
                Recursive = true,
                EnableTotalRecordCount = false
            };

            var artists = _libraryManager.GetItemsResult(artistQuery).Items;

            foreach (var artist in artists)
            {
                try
                {
                    var name = artist.Name ?? string.Empty;
                    if (!string.IsNullOrWhiteSpace(name)
                        && TryComputeArtistPercent(user, artist.Id, out var percent))
                    {
                        result[name] = percent;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "[AchievementBadges] Artist completion calc failed for {Artist}", artist.Name);
                }
            }
        }
        catch (Exception ex)
        {
            // Same guard as the library recompute above: replace semantics
            // plus a failed enumeration must not wipe stored percentages.
            _logger.LogWarning(ex, "[AchievementBadges] Artist completion recompute failed for user {UserId}", userGuid);
            return result;
        }

        _badgeService.UpdateArtistCompletionPercents(userGuid.ToString("D"), result);
        return result;
    }

    /// <summary>
    /// Scoped variant for the live playback path: recomputes only the named
    /// artists and merges them into the stored map. Before this existed the
    /// dictionary had exactly one writer, the full recompute above, and its
    /// only caller was the watch history scan — so listening to an album live
    /// never moved the discography badges until an admin happened to run a
    /// scan (reported in issue #24 as "Sampler" not unlocking).
    /// <para>
    /// Artists are resolved by name through a MusicArtist query rather than
    /// ILibraryManager.GetArtist, because GetArtist is get-or-create and
    /// would write artist entries into the library as a side effect.
    /// </para>
    /// <para>
    /// The single-track skip rule can leave a stale entry behind when an
    /// artist's library shrinks to one track: the merge never deletes, so the
    /// old percentage stays until the next full recompute replaces the map.
    /// Accepted: the full scan remains the reconciler, this path is additive.
    /// </para>
    /// </summary>
    public Dictionary<string, int> RecomputeArtistsForUser(Guid userGuid, IReadOnlyCollection<string> artistNames)
    {
        var result = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        if (artistNames is null || artistNames.Count == 0)
        {
            return result;
        }

        var user = _userManager.GetUserById(userGuid);
        if (user is null)
        {
            return result;
        }

        foreach (var name in artistNames)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            try
            {
                var artistQuery = new InternalItemsQuery(user)
                {
                    IncludeItemTypes = new[] { BaseItemKind.MusicArtist },
                    Name = name,
                    Recursive = true,
                    EnableTotalRecordCount = false
                };

                foreach (var artist in _libraryManager.GetItemsResult(artistQuery).Items)
                {
                    if (TryComputeArtistPercent(user, artist.Id, out var percent))
                    {
                        result[name] = percent;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "[AchievementBadges] Scoped artist completion calc failed for {Artist}", name);
            }
        }

        _badgeService.MergeArtistCompletionPercents(userGuid.ToString("D"), result);
        return result;
    }

    /// <summary>
    /// Played tracks over the artist's tracks, counted on album artist. False
    /// for artists with fewer than two tracks — their percentage is only ever
    /// 0 or 100, which would hand out "completed an artist" for one play.
    /// </summary>
    private bool TryComputeArtistPercent(Jellyfin.Database.Implementations.Entities.User user, Guid artistId, out int percent)
    {
        percent = 0;

        var totalQuery = new InternalItemsQuery(user)
        {
            IncludeItemTypes = new[] { BaseItemKind.Audio },
            AlbumArtistIds = new[] { artistId },
            Recursive = true,
            EnableTotalRecordCount = false
        };

        var total = _libraryManager.GetItemsResult(totalQuery).Items.Count;
        if (total < 2)
        {
            return false;
        }

        var playedQuery = new InternalItemsQuery(user)
        {
            IncludeItemTypes = new[] { BaseItemKind.Audio },
            AlbumArtistIds = new[] { artistId },
            IsPlayed = true,
            Recursive = true,
            EnableTotalRecordCount = false
        };

        var played = _libraryManager.GetItemsResult(playedQuery).Items.Count;
        percent = (int)Math.Round(100.0 * played / total);
        return true;
    }

    public Dictionary<string, Dictionary<string, int>> RecomputeAll()
    {
        var all = new Dictionary<string, Dictionary<string, int>>();
        foreach (var user in _userManager.EnumerateAll())
        {
            all[user.Id.ToString("D")] = RecomputeForUser(user.Id);
        }
        return all;
    }
}
