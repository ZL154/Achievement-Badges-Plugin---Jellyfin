using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Data.Enums;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;
using Microsoft.Extensions.Logging;
using SortOrder = Jellyfin.Database.Implementations.Enums.SortOrder;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class RecommendationService
{
    private readonly ILibraryManager _libraryManager;
    private readonly IUserManager _userManager;
    private readonly AchievementBadgeService _badgeService;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(
        ILibraryManager libraryManager,
        IUserManager userManager,
        AchievementBadgeService badgeService,
        ILogger<RecommendationService> logger)
    {
        _libraryManager = libraryManager;
        _userManager = userManager;
        _badgeService = badgeService;
        _logger = logger;
    }

    public object ChaseBadge(string userId, string badgeId, int limit = 10)
    {
        if (!Guid.TryParse(userId, out var userGuid)) return new { Items = Array.Empty<object>() };
        var user = _userManager.GetUserById(userGuid);
        if (user is null) return new { Items = Array.Empty<object>() };

        var def = _badgeService.GetActiveDefinitions()
            .FirstOrDefault(d => d.Id.Equals(badgeId, StringComparison.OrdinalIgnoreCase));
        if (def is null) return new { Items = Array.Empty<object>() };

        var profile = _badgeService.PeekProfile(userId);
        var counters = profile?.Counters;

        // Heuristic: for metrics backed by sets, recommend items that would fill the set.
        // For count-based metrics, recommend unwatched items from the relevant type.
        try
        {
            var query = new InternalItemsQuery(user)
            {
                IsPlayed = false,
                Recursive = true,
                EnableTotalRecordCount = false,
                Limit = limit * 4,
                OrderBy = new[] { (ItemSortBy.Random, SortOrder.Ascending) }
            };

            long minTicks = 0, maxTicks = 0;
            switch (def.Metric)
            {
                case AchievementMetric.MoviesWatched:
                case AchievementMetric.MaxMoviesInSingleDay:
                    query.IncludeItemTypes = new[] { BaseItemKind.Movie };
                    break;
                case AchievementMetric.SeriesCompleted:
                case AchievementMetric.LongSeriesCompleted:
                case AchievementMetric.VeryLongSeriesCompleted:
                    query.IncludeItemTypes = new[] { BaseItemKind.Series };
                    break;
                case AchievementMetric.MaxEpisodesInSingleDay:
                    query.IncludeItemTypes = new[] { BaseItemKind.Episode };
                    break;
                case AchievementMetric.LongestItemMinutes:
                    query.IncludeItemTypes = new[] { BaseItemKind.Movie };
                    minTicks = TimeSpan.FromMinutes(def.TargetValue).Ticks;
                    break;
                case AchievementMetric.ShortItemsWatched:
                    query.IncludeItemTypes = new[] { BaseItemKind.Movie, BaseItemKind.Episode };
                    maxTicks = TimeSpan.FromMinutes(30).Ticks - 1;
                    break;
                case AchievementMetric.GenreItemsWatched:
                    query.IncludeItemTypes = new[] { BaseItemKind.Movie, BaseItemKind.Episode };
                    if (!string.IsNullOrWhiteSpace(def.MetricParameter))
                    {
                        query.Genres = new[] { def.MetricParameter! };
                    }
                    break;
                case AchievementMetric.LateNightSessions:
                case AchievementMetric.EarlyMorningSessions:
                case AchievementMetric.WeekendSessions:
                    query.IncludeItemTypes = new[] { BaseItemKind.Movie, BaseItemKind.Episode };
                    break;
                default:
                    query.IncludeItemTypes = new[] { BaseItemKind.Movie, BaseItemKind.Episode };
                    break;
            }

            var items = _libraryManager.GetItemsResult(query).Items;
            var projected = items
                .Where(i => (minTicks == 0 || (i.RunTimeTicks ?? 0) >= minTicks))
                .Where(i => (maxTicks == 0 || ((i.RunTimeTicks ?? 0) > 0 && (i.RunTimeTicks ?? 0) <= maxTicks)))
                .Where(i => FilterForBadge(i, def, counters))
                .Take(limit)
                .Select(ProjectItem)
                .ToList();

            return new
            {
                BadgeId = def.Id,
                BadgeTitle = def.Title,
                Progress = new { Current = profile?.Badges.FirstOrDefault(b => b.Id == def.Id)?.CurrentValue ?? 0, Target = def.TargetValue },
                Items = projected
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[AchievementBadges] ChaseBadge failed for {BadgeId}", badgeId);
            return new { Items = Array.Empty<object>() };
        }
    }

    public object GetRecommendations(string userId, int limit = 10)
    {
        // Find the badge that the user is closest to unlocking and chase that one.
        var badges = _badgeService.GetBadgesForUser(userId)
            .Where(b => !b.Unlocked && b.TargetValue > 0)
            .OrderByDescending(b => (double)b.CurrentValue / b.TargetValue)
            .ThenBy(b => b.TargetValue - b.CurrentValue)
            .Take(3)
            .ToList();

        var groups = badges.Select(b => ChaseBadge(userId, b.Id, limit / 3 + 1)).ToList();
        return new { BadgeTargets = groups };
    }

    private static bool FilterForBadge(BaseItem item, AchievementDefinition def, UserAchievementCounters? counters)
    {
        if (counters is null) return true;

        switch (def.Metric)
        {
            case AchievementMetric.UniqueDecadesWatched:
                if (item.ProductionYear.HasValue)
                {
                    var dec = item.ProductionYear.Value / 10 * 10;
                    return !counters.DecadesWatched.Contains(dec);
                }
                return false;
            case AchievementMetric.UniqueCountriesWatched:
                return item.ProductionLocations != null && item.ProductionLocations.Length > 0 &&
                       item.ProductionLocations.Any(loc => !counters.CountriesWatched.Contains(loc));
            case AchievementMetric.UniqueGenresWatched:
                return item.Genres != null && item.Genres.Length > 0 &&
                       item.Genres.Any(g => !counters.GenresWatched.Contains(g));
            default:
                return true;
        }
    }

    private static object ProjectItem(BaseItem item)
    {
        return new
        {
            Id = item.Id.ToString("D"),
            Name = item.Name,
            Type = item.GetType().Name,
            Year = item.ProductionYear,
            RunTimeMinutes = item.RunTimeTicks.HasValue ? (int)(item.RunTimeTicks.Value / TimeSpan.TicksPerMinute) : 0
        };
    }
}
