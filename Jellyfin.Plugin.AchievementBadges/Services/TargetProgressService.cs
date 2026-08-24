using System;
using System.Collections.Generic;
using System.Linq;
using Jellyfin.Data.Enums;
using Jellyfin.Database.Implementations.Entities;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>[issue #107] One pass of targeted progress for one user.</summary>
public sealed class TargetProgressResult
{
    public Dictionary<string, int> ContainerPercents { get; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, int> PlayCounts { get; } = new(StringComparer.OrdinalIgnoreCase);

    public bool IsEmpty => ContainerPercents.Count == 0 && PlayCounts.Count == 0;
}

/// <summary>
/// [issue #107] Computes the two targeted metrics against the library.
/// <para>
/// Kept out of LibraryCompletionService on purpose: that file already carries
/// two unrelated jobs (library folders and artist discography), and targets
/// are a third with a different lifecycle.
/// </para>
/// <para>
/// Leaf resolution has two shapes because Jellyfin has two shapes of
/// container. Series, Season and MusicAlbum are real folders, so their leaves
/// come from an AncestorIds query. BoxSet and Playlist are Folder subclasses
/// too, but they hold their members as linked children, which AncestorIds
/// does not reach, so those go through GetLinkedChildren and expand any
/// folder member (a whole series dropped into a collection) through the
/// first path.
/// </para>
/// </summary>
public class TargetProgressService
{
    private static readonly BaseItemKind[] LeafKinds =
    {
        BaseItemKind.Movie,
        BaseItemKind.Episode,
        BaseItemKind.Audio,
        BaseItemKind.AudioBook,
        BaseItemKind.Book,
    };

    private readonly ILibraryManager _libraryManager;
    private readonly IUserDataManager _userDataManager;
    private readonly IUserManager _userManager;
    private readonly CustomBadgeService _customBadges;
    private readonly AchievementBadgeService _badgeService;
    private readonly ILogger<TargetProgressService> _logger;

    public TargetProgressService(
        ILibraryManager libraryManager,
        IUserDataManager userDataManager,
        IUserManager userManager,
        CustomBadgeService customBadges,
        AchievementBadgeService badgeService,
        ILogger<TargetProgressService> logger)
    {
        _libraryManager = libraryManager;
        _userDataManager = userDataManager;
        _userManager = userManager;
        _customBadges = customBadges;
        _badgeService = badgeService;
        _logger = logger;
    }

    /// <summary>
    /// Played leaves over total leaves. Null for an empty container: zero of
    /// zero otherwise reads as complete and hands out the badge for free.
    /// </summary>
    public static int? Percent(int total, int played)
    {
        if (total <= 0)
        {
            return null;
        }

        return (int)Math.Round(100.0 * played / total);
    }

    /// <summary>
    /// Full pass over every observed target. It is the reconciler: the only
    /// path that recomputes targets the live path never sees.
    /// </summary>
    public TargetProgressResult RecomputeForUser(Guid userGuid)
    {
        var result = new TargetProgressResult();
        var user = _userManager.GetUserById(userGuid);
        if (user is null)
        {
            return result;
        }

        var targets = CollectTargets();
        if (targets.Count == 0)
        {
            return result;
        }

        try
        {
            foreach (var target in targets)
            {
                Compute(user, target, result);
            }
        }
        catch (Exception ex)
        {
            // Same guard as the library and artist recomputes: a failed
            // enumeration must not publish a partial map over progress that is
            // still true.
            _logger.LogWarning(ex, "[AchievementBadges] Target recompute failed for user {UserId}", userGuid);
            return new TargetProgressResult();
        }

        Publish(userGuid, result);
        return result;
    }

    /// <summary>
    /// Scoped pass for the live path: only the targets that contain the item
    /// whose played flag just changed.
    /// </summary>
    public TargetProgressResult RecomputeForItem(Guid userGuid, BaseItem item)
    {
        var result = new TargetProgressResult();
        if (item is null)
        {
            return result;
        }

        var user = _userManager.GetUserById(userGuid);
        if (user is null)
        {
            return result;
        }

        foreach (var target in CollectTargets())
        {
            try
            {
                if (!Contains(user, target, item))
                {
                    continue;
                }

                Compute(user, target, result);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "[AchievementBadges] Scoped target recompute failed for {Target}", target.Name);
            }
        }

        Publish(userGuid, result);
        return result;
    }

    public void RecomputeAll()
    {
        foreach (var user in _userManager.EnumerateAll())
        {
            RecomputeForUser(user.Id);
        }
    }

    private IReadOnlyList<ObservedTarget> CollectTargets()
    {
        var cap = Plugin.Instance?.Configuration?.MaxTargetedBadgeTargets ?? 50;
        var targets = ObservedTargets.Collect(_customBadges.GetEnabled(), cap, out var dropped);
        if (dropped.Count > 0)
        {
            _logger.LogWarning(
                "[AchievementBadges] {Count} badge targets exceed the cap of {Cap} and are not computed: {Names}",
                dropped.Count, cap, string.Join(", ", dropped));
        }

        return targets;
    }

    /// <summary>
    /// Both writers merge. The maps are keyed by target, and a pass that only
    /// looked at one target must not erase the rest: replacing from the scoped
    /// path is the defect fixed for artists in 3c23df4.
    /// </summary>
    private void Publish(Guid userGuid, TargetProgressResult result)
    {
        if (result.IsEmpty)
        {
            return;
        }

        var userId = userGuid.ToString("D");
        _badgeService.MergeContainerCompletionPercents(userId, result.ContainerPercents);
        _badgeService.MergeItemPlayCounts(userId, result.PlayCounts);
    }

    private void Compute(User user, ObservedTarget target, TargetProgressResult result)
    {
        var item = Resolve(user, target);
        if (item is null)
        {
            // Keep the last known value. A collection deleted this morning
            // should not zero everyone's progress bar this afternoon.
            _logger.LogDebug("[AchievementBadges] Target did not resolve: {Name}", target.Name);
            return;
        }

        var key = item.Id.ToString("N");

        if (target.Metric == AchievementMetric.ItemPlayCount)
        {
            var data = _userDataManager.GetUserData(user, item);
            result.PlayCounts[key] = data?.PlayCount ?? 0;
            return;
        }

        if (item is not Folder folder)
        {
            return;
        }

        var leaves = Leaves(user, folder);
        var played = leaves.Count(l => _userDataManager.GetUserData(user, l)?.Played == true);
        var percent = Percent(leaves.Count, played);
        if (percent.HasValue)
        {
            result.ContainerPercents[key] = percent.Value;
        }
    }

    private BaseItem? Resolve(User user, ObservedTarget target)
    {
        if (target.Id != Guid.Empty)
        {
            var byId = _libraryManager.GetItemById(target.Id);
            if (byId is not null)
            {
                return byId;
            }
        }

        // Fallback by name. This is the case a mass rename upstream of
        // Jellyfin produces: the item was deleted and re-added, so the GUID is
        // dead while the title is intact.
        var query = new InternalItemsQuery(user)
        {
            Name = target.Name,
            Recursive = true,
            EnableTotalRecordCount = false,
        };

        var matches = _libraryManager.GetItemsResult(query).Items;
        if (matches.Count != 1)
        {
            // Zero means gone; more than one means ambiguous, and guessing
            // would silently attach the badge to the wrong show.
            return null;
        }

        var found = matches[0];
        RewriteParameter(target, found.Id);
        return found;
    }

    private void RewriteParameter(ObservedTarget target, Guid resolvedId)
    {
        foreach (var badge in _customBadges.GetEnabled())
        {
            if (RewriteNode(badge.Criteria, target, resolvedId))
            {
                _customBadges.Upsert(badge);
                _logger.LogInformation(
                    "[AchievementBadges] Target {Name} re-resolved to {Id}; badge {Badge} updated",
                    target.Name, resolvedId, badge.Name);
            }
        }
    }

    private static bool RewriteNode(CustomBadgeCriteria? node, ObservedTarget target, Guid resolvedId)
    {
        if (node is null)
        {
            return false;
        }

        if (node.Children is { Count: > 0 })
        {
            var changed = false;
            foreach (var child in node.Children)
            {
                changed |= RewriteNode(child, target, resolvedId);
            }

            return changed;
        }

        if (node.Metric != target.Metric
            || !string.Equals(node.MetricParameter, target.Parameter, StringComparison.Ordinal))
        {
            return false;
        }

        node.MetricParameter = TargetRef.Format(resolvedId, target.Name);
        return true;
    }

    private IReadOnlyList<BaseItem> Leaves(User user, Folder folder)
    {
        if (!IsLinkedContainer(folder))
        {
            return Descendants(user, folder.Id);
        }

        var leaves = new List<BaseItem>();
        foreach (var child in folder.GetLinkedChildren(user))
        {
            if (child is Folder inner)
            {
                leaves.AddRange(Descendants(user, inner.Id));
            }
            else
            {
                leaves.Add(child);
            }
        }

        return leaves;
    }

    /// <summary>
    /// Collections and playlists hold members as linked children, which an
    /// AncestorIds query does not reach. Matched on type name rather than on
    /// the concrete types so this file does not take a compile-time reference
    /// to the collections and playlists assemblies for a two-branch decision.
    /// </summary>
    private static bool IsLinkedContainer(Folder folder)
    {
        var typeName = folder.GetType().Name;
        return string.Equals(typeName, "BoxSet", StringComparison.Ordinal)
            || string.Equals(typeName, "Playlist", StringComparison.Ordinal);
    }

    private IReadOnlyList<BaseItem> Descendants(User user, Guid ancestorId)
    {
        var query = new InternalItemsQuery(user)
        {
            IncludeItemTypes = LeafKinds,
            AncestorIds = new[] { ancestorId },
            Recursive = true,
            EnableTotalRecordCount = false,
        };

        return _libraryManager.GetItemsResult(query).Items;
    }

    private bool Contains(User user, ObservedTarget target, BaseItem item)
    {
        if (target.Id == Guid.Empty)
        {
            // Unresolved targets are always recomputed: that pass is what
            // resolves them.
            return true;
        }

        if (target.Metric == AchievementMetric.ItemPlayCount)
        {
            return target.Id == item.Id;
        }

        if (_libraryManager.GetItemById(target.Id) is not Folder folder)
        {
            return true;
        }

        if (IsLinkedContainer(folder))
        {
            return Leaves(user, folder).Any(l => l.Id == item.Id);
        }

        var query = new InternalItemsQuery(user)
        {
            AncestorIds = new[] { target.Id },
            ItemIds = new[] { item.Id },
            Recursive = true,
            EnableTotalRecordCount = false,
        };

        return _libraryManager.GetItemsResult(query).Items.Count > 0;
    }
}
