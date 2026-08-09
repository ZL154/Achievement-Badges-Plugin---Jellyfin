using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Jellyfin.Data.Enums;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class WatchHistoryBackfillService
{
    /// <summary>
    /// One gate per user, so two overlapping invocations can never interleave
    /// their <c>ResetBadgesForUser</c> and accumulation passes over the same
    /// profile. Without this, a double click on the admin page's scan button
    /// (or a per-user scan issued while a scan-all is in flight) resets the
    /// profile twice and counts part of the history twice, producing inflated
    /// counters and badges unlocked on thresholds that were never really met.
    /// The second caller waits and then performs its own clean pass, which is
    /// safe because a single isolated backfill is idempotent.
    /// </summary>
    private readonly ConcurrentDictionary<Guid, object> _userGates = new();

    private readonly ILibraryManager _libraryManager;
    private readonly IUserManager _userManager;
    private readonly IUserDataManager _userDataManager;
    private readonly AchievementBadgeService _achievementBadgeService;
    private readonly LibraryCompletionService _libraryCompletionService;
    private readonly TracearrCreditLedger _tracearrLedger;
    private readonly ILogger<WatchHistoryBackfillService> _logger;

    public WatchHistoryBackfillService(
        ILibraryManager libraryManager,
        IUserManager userManager,
        IUserDataManager userDataManager,
        AchievementBadgeService achievementBadgeService,
        LibraryCompletionService libraryCompletionService,
        TracearrCreditLedger tracearrLedger,
        ILogger<WatchHistoryBackfillService> logger)
    {
        _libraryManager = libraryManager;
        _userManager = userManager;
        _userDataManager = userDataManager;
        _achievementBadgeService = achievementBadgeService;
        _libraryCompletionService = libraryCompletionService;
        _tracearrLedger = tracearrLedger;
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

        foreach (var user in _userManager.EnumerateAll())
        {
            var result = RunBackfillForUser(user.Id, user.Username);
            results.Add(result);
        }

        return new { Success = true, Message = $"Backfilled {results.Count} users.", Users = results };
    }

    private object RunBackfillForUser(Guid userGuid, string username)
    {
        // Serialise per user. See _userGates for why.
        var gate = _userGates.GetOrAdd(userGuid, static _ => new object());
        lock (gate)
        {
            return RunBackfillForUserCore(userGuid, username);
        }
    }

    /// <summary>
    /// [issue #45] Credits the plays Tracearr holds that the library replay
    /// could not account for.
    /// <para>
    /// Two distinct gaps, and this closes both without overlapping the replay:
    /// an item Tracearr knows but the library cannot prove is media that has
    /// been deleted, so its first play is a genuine watch; and every play
    /// after the first, for any item, is a rewatch. The library query is
    /// <c>IsPlayed = true</c>, a boolean, so it can never produce a rewatch
    /// count no matter how many times something was played.
    /// </para>
    /// <para>
    /// Only plays Tracearr itself considers finished are credited, so a
    /// thirty second sample does not become a watch. Everything is silent:
    /// a rebuild must not fire a burst of notifications.
    /// </para>
    /// </summary>
    /// <summary>
    /// [issue #45 button] Credits Tracearr plays without resetting or
    /// replaying anything, for the standalone sync.
    /// <para>
    /// The in-scan pass is safe because the scan wipes the profile first. This
    /// one writes onto live counters, so it leans entirely on the ledger to
    /// avoid counting a play twice. Pressing the button repeatedly credits
    /// nothing after the first time.
    /// </para>
    /// <para>
    /// It still has to know which items the library can account for, since
    /// that is what separates a first watch from a rewatch. Inside a scan that
    /// set falls out of the replay; here it is rebuilt with the same IsPlayed
    /// queries, which is the whole extra cost of running standalone.
    /// </para>
    /// </summary>
    public object SyncTracearrForUser(string userId)
    {
        if (!Guid.TryParse(userId, out var userGuid))
        {
            return new { Success = false, Message = "Invalid user ID." };
        }

        var user = _userManager.GetUserById(userGuid);
        if (user is null)
        {
            return new { Success = false, Message = "User not found." };
        }

        var config = Plugin.Instance?.Configuration;
        if (!TracearrClient.IsConfigured(config?.TracearrUrl, config?.TracearrApiToken))
        {
            return new { Success = false, Message = "Tracearr is not configured." };
        }

        // Same gate as the scan: one sync per user at a time, so two clicks
        // cannot interleave and read the ledger before either has written it.
        var gate = _userGates.GetOrAdd(userGuid, static _ => new object());
        lock (gate)
        {
            var normalised = userGuid.ToString("D");
            var credited = RunTracearrPass(normalised, user.Username, PlayedItemIds(user));

            return new
            {
                UserId = normalised,
                Username = user.Username,
                PlaysCredited = credited,
                Success = true
            };
        }
    }

    /// <summary>
    /// Item ids this user has played that the library can still prove, which
    /// is what the in-scan pass gets for free from its own replay.
    /// </summary>
    private HashSet<string> PlayedItemIds(Jellyfin.Database.Implementations.Entities.User user)
    {
        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var kind in new[] { BaseItemKind.Movie, BaseItemKind.Episode, BaseItemKind.Book })
        {
            var query = new InternalItemsQuery(user)
            {
                IsPlayed = true,
                IncludeItemTypes = new[] { kind },
                Recursive = true,
                EnableTotalRecordCount = false
            };

            foreach (var item in _libraryManager.GetItemsResult(query).Items)
            {
                ids.Add(item.Id.ToString("D"));
            }
        }

        return ids;
    }

    private int RunTracearrPass(string userId, string username, HashSet<string> creditedItemIds)
    {
        var config = Plugin.Instance?.Configuration;
        if (!TracearrClient.IsConfigured(config?.TracearrUrl, config?.TracearrApiToken))
        {
            return 0;
        }

        if (!TracearrClient.TryBuildBaseUri(config!.TracearrUrl, out var baseUri, out var urlError))
        {
            _logger.LogWarning("[AchievementBadges] Tracearr not used for {Username}: {Error}", username, urlError);
            return 0;
        }

        var credited = 0;

        try
        {
            var client = new TracearrClient(_logger);
            var accountId = client
                .ResolveAccountIdAsync(baseUri!, config.TracearrApiToken, userId, CancellationToken.None)
                .GetAwaiter().GetResult();

            if (string.IsNullOrEmpty(accountId))
            {
                // Not an error: plenty of Jellyfin users have never streamed
                // while Tracearr was watching, so they have no account there.
                _logger.LogInformation("[AchievementBadges] No Tracearr account matches {Username}.", username);
                return 0;
            }

            var plays = client
                .GetHistoryAsync(baseUri!, config.TracearrApiToken, accountId!, CancellationToken.None)
                .GetAwaiter().GetResult();

            var newlyCredited = new List<string>();
            foreach (var credit in TracearrCreditPlan.Build(plays, creditedItemIds, _tracearrLedger.For(userId)))
            {
                if (!string.IsNullOrWhiteSpace(credit.Play.Id)) newlyCredited.Add(credit.Play.Id!);
                var play = credit.Play;
                _achievementBadgeService.RecordPlayback(new PlaybackContext
                {
                    UserId = userId,
                    ItemId = play.RatingKey,
                    IsMovie = string.Equals(play.MediaType, "movie", StringComparison.OrdinalIgnoreCase),
                    IsEpisode = string.Equals(play.MediaType, "episode", StringComparison.OrdinalIgnoreCase),
                    IsRewatch = credit.IsRewatch,
                    // The date the play happened, not today, so an old viewing
                    // lands in the right day bucket and cannot manufacture a
                    // streak that never existed.
                    PlayedAt = play.StartedAt,
                    ProductionYear = play.Year,
                    RunTimeTicks = play.TotalDurationMs is long ms && ms > 0 ? ms * TimeSpan.TicksPerMillisecond : null,
                    Silent = true
                });

                credited++;
            }

            // Recorded after the fact: a play that failed to credit must not
            // be remembered as credited, or it is lost for good.
            _tracearrLedger.Remember(userId, newlyCredited);

            _logger.LogInformation(
                "[AchievementBadges] Tracearr credited {Count} plays for {Username} that the library could not account for.",
                credited, username);
        }
        catch (Exception ex)
        {
            // A backfill that credited the library correctly is still worth
            // keeping, so a Tracearr failure is reported and swallowed rather
            // than losing the whole rebuild.
            _logger.LogWarning(ex, "[AchievementBadges] Tracearr pass failed for {Username}; the library rebuild stands.", username);
        }

        return credited;
    }

    private object RunBackfillForUserCore(Guid userGuid, string username)
    {
        var userId = userGuid.ToString("D");
        var moviesWatched = 0;
        var episodesWatched = 0;
        var seriesCompleted = 0;
        var booksCompleted = 0;
        var librariesFound = new HashSet<string>();
        // [issue #45] Ids the library replay could prove. Anything Tracearr
        // knows that is NOT in here is a play of media that has since been
        // deleted, which is precisely what the library query cannot see.
        var creditedItemIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        try
        {
            _logger.LogInformation("[AchievementBadges] Starting backfill for {Username} ({UserId}).", username, userId);

            var user = _userManager.GetUserById(userGuid);
            if (user == null)
            {
                return new { UserId = userId, Username = username, Success = false, Error = "User not found." };
            }

            // Issue #48 companion: capture the counters before the
            // reset so the rebuild can never move a lifetime total backwards.
            // Media deleted since it was watched is invisible to the replay
            // below, and without a floor every total it once fed would
            // silently shrink.
            var preScanCounters = _achievementBadgeService.SnapshotCountersForUser(userId);

            // Same window, separate value: the score bank is spendable
            // currency that accrues per watched item, not per badge, so
            // carrying unlocks over does not carry it.
            var preScanScoreBank = _achievementBadgeService.SnapshotScoreBankForUser(userId);

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

                creditedItemIds.Add(movie.Id.ToString("D"));

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
                    // v1.9.3 — Studio specialists (Studio Ghibli, A24, etc).
                    Studios = movie.Studios,
                    Silent = true
                });
            }

            // [v2.1.x, issue #24] Query all "read" books. Ebooks never emit
            // playback sessions (you don't "play" a book), so PlaybackStopped
            // never fires for them and they were never tracked. They're
            // credited here via the IsPlayed flag — the same backfill model as
            // movies — so existing read books count toward Book badges.
            var bookQuery = new InternalItemsQuery(user)
            {
                IsPlayed = true,
                IncludeItemTypes = new[] { BaseItemKind.Book },
                Recursive = true,
                EnableTotalRecordCount = false
            };

            var books = _libraryManager.GetItemsResult(bookQuery).Items;
            booksCompleted = books.Count;

            foreach (var book in books)
            {
                var bookLibrary = GetLibraryName(book);
                if (!string.IsNullOrEmpty(bookLibrary))
                {
                    librariesFound.Add(bookLibrary);
                }

                creditedItemIds.Add(book.Id.ToString("D"));

                _achievementBadgeService.RecordPlayback(new PlaybackContext
                {
                    UserId = userId,
                    ItemId = book.Id.ToString("D"),
                    IsBook = true,
                    LibraryName = bookLibrary,
                    PlayedAt = GetPlayedDate(user, book),
                    ProductionYear = book.ProductionYear,
                    Genres = book.Genres,
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

                creditedItemIds.Add(episode.Id.ToString("D"));

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
                    // v1.9.3 — Studio specialists + pilot/completer tracking.
                    Studios = episode.Studios,
                    SeriesId = seriesId != Guid.Empty ? seriesId.ToString("D") : null,
                    SeasonNumber = episode.ParentIndexNumber,
                    EpisodeNumber = episode.IndexNumber,
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

            // [issue #45] Tracearr fills the two holes the replay above cannot
            // reach: plays of media deleted since it was watched, and how many
            // times an item was played. No-op unless an admin configured it.
            //
            // ORDER MATTERS: this runs BEFORE the counter floor, not after.
            // The floor restores each counter to its pre scan value, which
            // already includes those deleted-media watches from back when they
            // happened. Crediting them after the floor would stack them on top
            // of themselves and inflate every total they feed.
            var tracearrCredited = RunTracearrPass(userId, username, creditedItemIds);

            // Issue #48 companion: floor the rebuilt counters at their
            // pre scan values so deleted media never shrinks lifetime totals.
            _achievementBadgeService.ApplyCounterFloor(userId, preScanCounters);
            _achievementBadgeService.ApplyScoreBankFloor(userId, preScanScoreBank);

            // [issue #79] Library completion percentages come from the library
            // itself, not from the replay, so nothing above computes them. The
            // service and the five badges that read it have existed since the
            // metric was added, but the only caller was an endpoint nothing
            // invokes, which left the percentages empty and those badges stuck
            // at zero on every install. The scan is the natural place: the
            // library is already open and being enumerated far more heavily
            // than two counting queries per library cost.
            try
            {
                _libraryCompletionService.RecomputeForUser(userGuid);
                // [issue #79] Same reasoning one level down. Shipping the
                // discography metric without a caller would leave it in the
                // exact dead state this issue was opened about.
                _libraryCompletionService.RecomputeArtistsForUser(userGuid);
            }
            catch (Exception ex)
            {
                // Never lose a good rebuild over the completion extras.
                _logger.LogWarning(ex, "[AchievementBadges] Completion recompute failed for {Username}.", username);
            }

            _logger.LogInformation(
                "[AchievementBadges] Backfill done for {Username}: {Movies} movies, {Episodes} episodes, {Series} series, {Books} books, {Libraries} libraries.",
                username, moviesWatched, episodesWatched, seriesCompleted, booksCompleted, librariesFound.Count);

            return new
            {
                UserId = userId,
                Username = username,
                MoviesWatched = moviesWatched,
                EpisodesWatched = episodesWatched,
                SeriesCompleted = seriesCompleted,
                BooksCompleted = booksCompleted,
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
