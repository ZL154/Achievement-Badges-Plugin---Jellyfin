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
            _logger.LogWarning(ex, "[AchievementBadges] Library completion recompute failed for user {UserId}", userGuid);
        }

        _badgeService.UpdateLibraryCompletionPercents(userGuid.ToString("D"), result);
        return result;
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
