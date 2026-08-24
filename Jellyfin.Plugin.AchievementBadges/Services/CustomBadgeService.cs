using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// [v2.1.0 "Open Library" M4] Storage + runtime evaluation for admin-
/// defined custom badges. Sidecar JSON at <c>{pluginData}/custom-badges.json</c>
/// (not in PluginConfiguration.xml — custom badges churn frequently
/// and we want fast atomic writes without triggering the full plugin-
/// config save pipeline).
///
/// Evaluator handles compound AND/OR trees up to 5 levels deep. Deeper
/// trees are rejected at write time (DoS guard — admins can't author
/// a runaway evaluator).
/// </summary>
public class CustomBadgeService
{
    public const int MaxCriteriaDepth = 5;
    public const int MaxCriteriaNodes = 64;
    public const int MaxBadgesPerInstance = 500;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly string _filePath;
    private readonly ILogger<CustomBadgeService> _logger;
    private readonly object _lock = new();
    private List<CustomBadge> _badges = new();

    public CustomBadgeService(IApplicationPaths paths, ILogger<CustomBadgeService> logger)
    {
        _logger = logger;
        var dataDir = Path.Combine(paths.PluginConfigurationsPath, "AchievementBadges");
        Directory.CreateDirectory(dataDir);
        _filePath = Path.Combine(dataDir, "custom-badges.json");
        Load();
    }

    public IReadOnlyList<CustomBadge> GetAll()
    {
        lock (_lock) return _badges.ToList();
    }

    public IReadOnlyList<CustomBadge> GetEnabled()
    {
        lock (_lock) return _badges.Where(b => b.Enabled).ToList();
    }

    public CustomBadge? Get(string id)
    {
        if (string.IsNullOrEmpty(id)) return null;
        lock (_lock) return _badges.FirstOrDefault(b => b.Id == id);
    }

    public CustomBadge Upsert(CustomBadge badge)
    {
        ArgumentNullException.ThrowIfNull(badge);
        if (string.IsNullOrWhiteSpace(badge.Id)) badge.Id = Guid.NewGuid().ToString("N");
        if (string.IsNullOrWhiteSpace(badge.Name)) throw new ArgumentException("Custom badge requires a Name.");
        ValidateCriteria(badge.Criteria, depth: 1, totalNodeCount: out _);

        lock (_lock)
        {
            var existing = _badges.FindIndex(b => b.Id == badge.Id);
            if (existing < 0 && _badges.Count >= MaxBadgesPerInstance)
            {
                throw new InvalidOperationException(
                    $"Maximum of {MaxBadgesPerInstance} custom badges per instance reached.");
            }

            if (existing >= 0)
            {
                badge.CreatedAt = _badges[existing].CreatedAt;
                badge.CreatedBy = _badges[existing].CreatedBy;
                _badges[existing] = badge;
            }
            else
            {
                _badges.Add(badge);
            }
            Save();
        }
        _logger.LogInformation("[AchievementBadges] Custom badge upserted: Id={Id} Name={Name}", badge.Id, badge.Name);
        return badge;
    }

    public bool Delete(string id)
    {
        if (string.IsNullOrEmpty(id)) return false;
        lock (_lock)
        {
            var removed = _badges.RemoveAll(b => b.Id == id) > 0;
            if (removed) Save();
            return removed;
        }
    }

    public static bool Evaluate(CustomBadgeCriteria criteria,
        Func<AchievementMetric, string?, int> metricGetter)
    {
        ArgumentNullException.ThrowIfNull(criteria);
        ArgumentNullException.ThrowIfNull(metricGetter);
        return EvaluateNode(criteria, metricGetter, depth: 1);
    }

    private static bool EvaluateNode(CustomBadgeCriteria node,
        Func<AchievementMetric, string?, int> metricGetter, int depth)
    {
        if (depth > MaxCriteriaDepth) return false;

        var isLeaf = node.Metric.HasValue && node.Threshold.HasValue;
        var isCompound = node.Operator.HasValue && node.Children is { Count: > 0 };

        if (isLeaf)
        {
            var value = metricGetter(node.Metric!.Value, node.MetricParameter);
            return value >= node.Threshold!.Value;
        }

        if (isCompound)
        {
            return node.Operator!.Value switch
            {
                CompoundOperator.And => node.Children!.All(c => EvaluateNode(c, metricGetter, depth + 1)),
                CompoundOperator.Or => node.Children!.Any(c => EvaluateNode(c, metricGetter, depth + 1)),
                _ => false,
            };
        }

        return false;
    }

    public static (int current, int target) ProgressSignal(CustomBadgeCriteria criteria,
        Func<AchievementMetric, string?, int> metricGetter)
    {
        ArgumentNullException.ThrowIfNull(criteria);
        ArgumentNullException.ThrowIfNull(metricGetter);
        return ProgressSignalNode(criteria, metricGetter, depth: 1);
    }

    private static (int current, int target) ProgressSignalNode(CustomBadgeCriteria node,
        Func<AchievementMetric, string?, int> metricGetter, int depth)
    {
        if (depth > MaxCriteriaDepth) return (0, 1);

        var isLeaf = node.Metric.HasValue && node.Threshold.HasValue;
        if (isLeaf)
        {
            var v = metricGetter(node.Metric!.Value, node.MetricParameter);
            var t = node.Threshold!.Value;
            return (Math.Clamp(v, 0, t), t);
        }

        if (node.Operator.HasValue && node.Children is { Count: > 0 } kids)
        {
            var satisfied = kids.Count(c => EvaluateNode(c, metricGetter, depth + 1));
            return (satisfied, kids.Count);
        }

        return (0, 1);
    }

    private static void ValidateCriteria(CustomBadgeCriteria criteria, int depth, out int totalNodeCount)
    {
        totalNodeCount = 0;
        ValidateNode(criteria, depth, ref totalNodeCount);
    }

    private static void ValidateNode(CustomBadgeCriteria node, int depth, ref int totalNodeCount)
    {
        if (node is null) throw new ArgumentException("Criteria node cannot be null.");
        if (depth > MaxCriteriaDepth)
            throw new ArgumentException($"Criteria tree exceeds maximum depth of {MaxCriteriaDepth}.");
        totalNodeCount++;
        if (totalNodeCount > MaxCriteriaNodes)
            throw new ArgumentException($"Criteria tree exceeds maximum of {MaxCriteriaNodes} nodes.");

        var isLeaf = node.Metric.HasValue && node.Threshold.HasValue;
        var isCompound = node.Operator.HasValue && node.Children is { Count: > 0 };

        if (isLeaf && isCompound)
            throw new ArgumentException("Criteria node cannot be both leaf and compound.");
        if (!isLeaf && !isCompound)
            throw new ArgumentException("Criteria node must be either leaf (Metric+Threshold) or compound (Operator+Children).");
        if (isLeaf && node.Threshold!.Value < 1)
            throw new ArgumentException("Leaf threshold must be at least 1.");

        // [issue #107] A targeted metric with no target can never unlock, and
        // it fails silently: the badge renders and sits at zero forever. Reject
        // it here, while the admin is still looking at the form. A bare name
        // with no GUID is allowed; it resolves on the first recompute.
        if (isLeaf && IsTargeted(node.Metric!.Value))
        {
            if (!TargetRef.TryParse(node.MetricParameter, out _, out var targetName)
                || string.IsNullOrWhiteSpace(targetName))
            {
                throw new ArgumentException(
                    "Metric " + node.Metric.Value + " requires a target in MetricParameter.");
            }
        }

        if (isCompound)
        {
            foreach (var child in node.Children!) ValidateNode(child, depth + 1, ref totalNodeCount);
        }
    }

    private static bool IsTargeted(AchievementMetric metric)
    {
        return metric is AchievementMetric.ContainerCompletionPercent
            or AchievementMetric.ItemPlayCount;
    }

    private void Load()
    {
        try
        {
            if (!File.Exists(_filePath))
            {
                _badges = new List<CustomBadge>();
                return;
            }
            var json = File.ReadAllText(_filePath);
            if (string.IsNullOrWhiteSpace(json))
            {
                _badges = new List<CustomBadge>();
                return;
            }
            var loaded = JsonSerializer.Deserialize<List<CustomBadge>>(json, _jsonOptions);
            _badges = loaded ?? new List<CustomBadge>();
            _logger.LogInformation("[AchievementBadges] Loaded {Count} custom badges from {Path}", _badges.Count, _filePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AchievementBadges] Failed to load custom badges from {Path} — starting empty", _filePath);
            _badges = new List<CustomBadge>();
        }
    }

    private void Save()
    {
        try
        {
            var json = JsonSerializer.Serialize(_badges, _jsonOptions);
            var tmp = _filePath + ".tmp";
            File.WriteAllText(tmp, json);
            File.Move(tmp, _filePath, overwrite: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AchievementBadges] Failed to persist custom badges to {Path}", _filePath);
        }
    }
}
