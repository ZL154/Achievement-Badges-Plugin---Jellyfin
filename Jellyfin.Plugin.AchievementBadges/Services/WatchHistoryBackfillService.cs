using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Data.Enums;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class WatchHistoryBackfillService
{
    private readonly ILibraryManager _libraryManager;
    private readonly IUserManager _userManager;
    private readonly IUserDataManager _userDataManager;
    private readonly AchievementBadgeService _achievementBadgeService;
    private readonly ILogger<WatchHistoryBackfillService> _logger;

    public WatchHistoryBackfillService(
        ILibraryManager libraryManager,
        IUserManager userManager,
        IUserDataManager userDataManager,
        AchievementBadgeService achievementBadgeService,
        ILogger<WatchHistoryBackfillService> logger)
    {
        _libraryManager = libraryManager;
        _userManager = userManager;
        _userDataManager = userDataManager;
        _achievementBadgeService = achievementBadgeService;
        _logger = logger;
    }

    public object BackfillUser(string userId)
    {
        if (!Guid.TryParse(userId, out var userGuid))
        {
            return new { Success = false, Message = "Invalid user ID." };
        }

        var user = _userManager.GetUserById(userGuid);
        if (user == null)
        {
            return new { Success = false, Message = "User not found." };
        }

        return RunBackfillForUser(userGuid, user.Username);
    }

    public object BackfillAllUsers()
    {
        var results = new List<object>();

        foreach (var user in _userManager.Users)
        {
            var result = RunBackfillForUser(user.Id, user.Username);
            results.Add(result);
        }

        return new { Success = true, Message = $"Backfilled {results.Count} users.", Users = results };
    }

    private object RunBackfillForUser(Guid userGuid, string username)
    {
        var userId = userGuid.ToString("D");
        var moviesWatched = 0;
        var episodesWatched = 0;
        var seriesCompleted = 0;
        var librariesFound = new HashSet<string>();

        try
        {
            _logger.LogInformation("[AchievementBadges] Starting backfill for {Username} ({UserId}).", username, userId);

            var user = _userManager.GetUserById(userGuid);
            if (user == null)
            {
                return new { UserId = userId, Username = username, Success = false, Error = "User not found." };
            }

            // Reset badges so we rebuild from watch history
            _achievementBadgeService.ResetBadgesForUser(userId);

            // Query all played movies
            var movieQuery = new InternalItemsQuery(user)
            {
                IsPlayed = true,
                IncludeItemTypes = new[] { BaseItemKind.Movie },
                Recursive = true,
                EnableTotalRecordCount = false
            };

            var movies = _libraryManager.GetItemsResult(movieQuery).Items;
            moviesWatched = movies.Count;

            foreach (var movie in movies)
            {
                var libraryName = GetLibraryName(movie);
                if (!string.IsNullOrEmpty(libraryName))
                {
                    librariesFound.Add(libraryName);
                }

                var playedDate = GetPlayedDate(user, movie);

                var (moviesDirectors, moviesActors) = GetPeople(movie);

                _achievementBadgeService.RecordPlayback(new PlaybackContext
                {
                    UserId = userId,
                    ItemId = movie.Id.ToString("D"),
                    IsMovie = true,
                    LibraryName = libraryName,
                    PlayedAt = playedDate,
                    ProductionYear = movie.ProductionYear,
                    ProductionLocations = movie.ProductionLocations,
                    OriginalLanguage = GetOriginalLanguage(movie),
                    Genres = movie.Genres,
                    RunTimeTicks = movie.RunTimeTicks,
                    Directors = moviesDirectors,
                    Actors = moviesActors,
                    Silent = true
                });
            }

            // Query all played episodes
            var episodeQuery = new InternalItemsQuery(user)
            {
                IsPlayed = true,
                IncludeItemTypes = new[] { BaseItemKind.Episode },
                Recursive = true,
                EnableTotalRecordCount = false
            };

            var episodes = _libraryManager.GetItemsResult(episodeQuery).Items;
            episodesWatched = episodes.Count;

            var episodesBySeries = new Dictionary<Guid, List<BaseItem>>();

            foreach (var episode in episodes)
            {
                var seriesId = GetSeriesId(episode);

                var libraryName = GetLibraryName(episode);
                if (!string.IsNullOrEmpty(libraryName))
                {
                    librariesFound.Add(libraryName);
                }

                var playedDate = GetPlayedDate(user, episode);

                var (epDirectors, epActors) = GetPeople(episode);

                _achievementBadgeService.RecordPlayback(new PlaybackContext
                {
                    UserId = userId,
                    ItemId = episode.Id.ToString("D"),
                    IsEpisode = true,
                    LibraryName = libraryName,
                    PlayedAt = playedDate,
                    ProductionYear = episode.ProductionYear,
                    ProductionLocations = episode.ProductionLocations,
                    OriginalLanguage = GetOriginalLanguage(episode),
                    Genres = episode.Genres,
                    RunTimeTicks = episode.RunTimeTicks,
                    Directors = epDirectors,
                    Actors = epActors,
                    Silent = true
                });

                if (seriesId != Guid.Empty)
                {
                    if (!episodesBySeries.ContainsKey(seriesId))
                    {
                        episodesBySeries[seriesId] = new List<BaseItem>();
                    }

                    episodesBySeries[seriesId].Add(episode);
                }
            }

            // Check for series completion
            foreach (var (seriesId, playedEpisodes) in episodesBySeries)
            {
                try
                {
                    var allEpisodesQuery = new InternalItemsQuery(user)
                    {
                        IncludeItemTypes = new[] { BaseItemKind.Episode },
                        AncestorIds = new[] { seriesId },
                        Recursive = true,
                        EnableTotalRecordCount = false
                    };

                    var totalEpisodes = _libraryManager.GetItemsResult(allEpisodesQuery).Items.Count;

                    if (totalEpisodes > 0 && playedEpisodes.Count >= totalEpisodes)
                    {
                        seriesCompleted++;

                        var latestDate = playedEpisodes
                            .Select(e => GetPlayedDate(user, e))
                            .OrderByDescending(d => d)
                            .FirstOrDefault();

                        _achievementBadgeService.RecordPlayback(new PlaybackContext
                        {
                            UserId = userId,
                            SeriesCompleted = true,
                            CompletedSeriesEpisodeCount = totalEpisodes,
                            PlayedAt = latestDate,
                            Silent = true
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[AchievementBadges] Failed to check series completion for series {SeriesId}.", seriesId);
                }
            }

            _logger.LogInformation(
                "[AchievementBadges] Backfill done for {Username}: {Movies} movies, {Episodes} episodes, {Series} series, {Libraries} libraries.",
                username, moviesWatched, episodesWatched, seriesCompleted, librariesFound.Count);

            return new
            {
                UserId = userId,
                Username = username,
                MoviesWatched = moviesWatched,
                EpisodesWatched = episodesWatched,
                SeriesCompleted = seriesCompleted,
                LibrariesVisited = librariesFound.Count,
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AchievementBadges] Backfill failed for {Username}.", username);
            return new { UserId = userId, Username = username, Success = false, Error = ex.Message };
        }
    }

    private string GetLibraryName(BaseItem item)
    {
        try
        {
            var folders = _libraryManager.GetCollectionFolders(item);
            var name = folders?.FirstOrDefault()?.Name;
            if (!string.IsNullOrWhiteSpace(name))
            {
                return name;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "[AchievementBadges] Failed to resolve collection folder for item {ItemId}.", item.Id);
        }

        return string.Empty;
    }

    private (List<string> directors, List<string> actors) GetPeople(BaseItem item)
    {
        var directors = new List<string>();
        var actors = new List<string>();
        try
        {
            var people = _libraryManager.GetPeople(item);
            if (people == null) return (directors, actors);
            foreach (var p in people)
            {
                if (p is null || string.IsNullOrWhiteSpace(p.Name)) continue;
                var role = p.Type.ToString();
                if (string.Equals(role, "Director", StringComparison.OrdinalIgnoreCase))
                {
                    directors.Add(p.Name);
                }
                else if (string.Equals(role, "Actor", StringComparison.OrdinalIgnoreCase))
                {
                    if (actors.Count < 5) actors.Add(p.Name);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "[AchievementBadges] GetPeople failed for {ItemId}", item.Id);
        }
        return (directors, actors);
    }

    private static string? GetOriginalLanguage(BaseItem item)
    {
        try
        {
            var prop = item.GetType().GetProperty("OriginalLanguage")
                        ?? item.GetType().GetProperty("PreferredMetadataLanguage");
            if (prop != null)
            {
                var value = prop.GetValue(item) as string;
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }
        }
        catch
        {
        }

        return null;
    }

    private static Guid GetSeriesId(BaseItem episode)
    {
        try
        {
            var prop = episode.GetType().GetProperty("SeriesId");
            if (prop != null)
            {
                var value = prop.GetValue(episode);
                if (value is Guid guid) return guid;
            }
        }
        catch
        {
        }

        return Guid.Empty;
    }

    private DateTimeOffset GetPlayedDate(object user, BaseItem item)
    {
        try
        {
            // Use reflection to call GetUserData since User type is internal
            var method = _userDataManager.GetType().GetMethod("GetUserData",
                new[] { user.GetType(), typeof(BaseItem) });

            if (method != null)
            {
                var userData = method.Invoke(_userDataManager, new[] { user, item });
                if (userData != null)
                {
                    var lastPlayedProp = userData.GetType().GetProperty("LastPlayedDate");
                    if (lastPlayedProp != null)
                    {
                        var lastPlayed = lastPlayedProp.GetValue(userData) as DateTime?;
                        if (lastPlayed.HasValue)
                        {
                            return new DateTimeOffset(lastPlayed.Value, TimeSpan.Zero);
                        }
                    }
                }
            }
        }
        catch
        {
        }

        return DateTimeOffset.UtcNow;
    }
}
