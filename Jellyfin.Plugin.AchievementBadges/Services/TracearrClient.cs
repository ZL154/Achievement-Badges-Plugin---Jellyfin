using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin.Plugin.AchievementBadges.Models;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

/// <summary>
/// [issue #45] Reads watch history from a Tracearr instance over its public v2
/// API.
/// <para>
/// Tracearr records a play when it happens and keeps it afterwards, so it
/// knows two things the library replay structurally cannot: plays of media
/// that has since been deleted, and how many times an item was played. The
/// library query behind the existing backfill is <c>IsPlayed = true</c>, a
/// boolean over items that still exist.
/// </para>
/// </summary>
public class TracearrClient
{
    // Redirects off, like WebhookNotifier: a redirect could otherwise walk an
    // admin-configured host into somewhere they did not intend.
    private static readonly HttpClient _http = new(new HttpClientHandler
    {
        AllowAutoRedirect = false
    })
    { Timeout = TimeSpan.FromSeconds(30) };

    private const int PageSize = 200;

    // A stop, not a target: a server with years of history should not be able
    // to hold a backfill open indefinitely.
    private const int MaxPages = 200;

    private readonly ILogger _logger;

    public TracearrClient(ILogger logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// True when an admin has filled in both fields. Absence is the off
    /// switch; there is no separate enable flag to fall out of sync with it.
    /// </summary>
    public static bool IsConfigured(string? url, string? token)
    {
        return !string.IsNullOrWhiteSpace(url) && !string.IsNullOrWhiteSpace(token);
    }

    /// <summary>
    /// Validates and normalises the configured base URL.
    /// <para>
    /// Deliberately does NOT reuse <c>WebhookUrlValidator</c>. That one
    /// rejects private address ranges, which is right for a webhook target
    /// supplied to reach the outside world, and wrong here: a self-hosted
    /// Tracearr almost always sits on the same LAN as Jellyfin, often on the
    /// same host. Refusing private ranges would reject the normal case.
    /// The value is set by a server admin in the plugin configuration, not by
    /// a user, so the exposure is different in kind.
    /// </para>
    /// </summary>
    public static bool TryBuildBaseUri(string? url, out Uri? baseUri, out string error)
    {
        baseUri = null;
        error = "";

        if (string.IsNullOrWhiteSpace(url))
        {
            error = "Tracearr URL is empty.";
            return false;
        }

        if (!Uri.TryCreate(url.Trim().TrimEnd('/'), UriKind.Absolute, out var parsed))
        {
            error = "Tracearr URL must be absolute, for example https://tracearr.example.";
            return false;
        }

        if (parsed.Scheme != Uri.UriSchemeHttp && parsed.Scheme != Uri.UriSchemeHttps)
        {
            error = "Tracearr URL must be http or https.";
            return false;
        }

        baseUri = parsed;
        return true;
    }

    private static HttpRequestMessage Request(Uri baseUri, string token, string pathAndQuery)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, new Uri(baseUri, pathAndQuery));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return request;
    }

    /// <summary>
    /// Finds the Tracearr account whose linked media-server identity matches
    /// this Jellyfin user, comparing ids with hyphens stripped because the two
    /// systems do not agree on GUID formatting.
    /// </summary>
    public async Task<string?> ResolveAccountIdAsync(Uri baseUri, string token, string jellyfinUserId, CancellationToken ct)
    {
        var wanted = Compact(jellyfinUserId);
        if (wanted.Length == 0) return null;

        using var response = await _http.SendAsync(Request(baseUri, token, "/api/v2/public/users?page_size=500"), ct).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("[AchievementBadges] Tracearr /users returned {Status}.", (int)response.StatusCode);
            return null;
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false));
        foreach (var account in EnumerateData(document.RootElement))
        {
            if (!account.TryGetProperty("identities", out var identities) || identities.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var identity in identities.EnumerateArray())
            {
                var external = ReadString(identity, "external_user_id");
                if (external is null || Compact(external) != wanted) continue;

                return ReadString(account, "id");
            }
        }

        return null;
    }

    /// <summary>
    /// Every play Tracearr holds for that account, following the cursor to the
    /// end. Returns what it managed to read: a partial history still closes
    /// part of the gap, and failing the whole backfill over one bad page would
    /// be worse than crediting less.
    /// </summary>
    public async Task<List<TracearrPlay>> GetHistoryAsync(Uri baseUri, string token, string accountId, CancellationToken ct)
    {
        var plays = new List<TracearrPlay>();
        string? cursor = null;

        for (var page = 0; page < MaxPages; page++)
        {
            var path = "/api/v2/public/users/" + Uri.EscapeDataString(accountId)
                + "/history?page_size=" + PageSize.ToString(CultureInfo.InvariantCulture)
                + (cursor is null ? "" : "&cursor=" + Uri.EscapeDataString(cursor));

            HttpResponseMessage response;
            try
            {
                response = await _http.SendAsync(Request(baseUri, token, path), ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                _logger.LogWarning(ex, "[AchievementBadges] Tracearr history request failed after {Count} plays.", plays.Count);
                return plays;
            }

            using (response)
            {
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning(
                        "[AchievementBadges] Tracearr history returned {Status} after {Count} plays.",
                        (int)response.StatusCode, plays.Count);
                    return plays;
                }

                using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false));
                var before = plays.Count;

                foreach (var row in EnumerateData(document.RootElement))
                {
                    var play = MapPlay(row);
                    if (play is not null) plays.Add(play);
                }

                cursor = ReadCursor(document.RootElement);
                // No cursor, or a page that produced nothing: stop rather than
                // trust the server to terminate the walk for us.
                if (cursor is null || plays.Count == before) break;
            }
        }

        return plays;
    }

    internal static TracearrPlay? MapPlay(JsonElement row)
    {
        var ratingKey = ReadString(row, "rating_key");
        if (string.IsNullOrWhiteSpace(ratingKey)) return null;

        return new TracearrPlay
        {
            RatingKey = ratingKey,
            MediaType = ReadString(row, "media_type"),
            MediaTitle = ReadString(row, "media_title"),
            ShowTitle = ReadString(row, "show_title"),
            Year = ReadInt(row, "year"),
            StartedAt = ReadDate(row, "started_at"),
            DurationMs = ReadLong(row, "duration_ms"),
            TotalDurationMs = ReadLong(row, "total_duration_ms"),
            Watched = row.TryGetProperty("watched", out var w) && w.ValueKind == JsonValueKind.True
        };
    }

    private static IEnumerable<JsonElement> EnumerateData(JsonElement root)
    {
        // Tracearr wraps list responses in { data: [...], next_cursor }, but a
        // bare array is cheap to tolerate and keeps this from breaking on a
        // shape change that does not matter here.
        if (root.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in root.EnumerateArray()) yield return item;
            yield break;
        }

        if (root.ValueKind == JsonValueKind.Object
            && root.TryGetProperty("data", out var data)
            && data.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in data.EnumerateArray()) yield return item;
        }
    }

    private static string? ReadCursor(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object) return null;
        foreach (var name in new[] { "next_cursor", "nextCursor" })
        {
            if (root.TryGetProperty(name, out var c) && c.ValueKind == JsonValueKind.String)
            {
                var value = c.GetString();
                if (!string.IsNullOrWhiteSpace(value)) return value;
            }
        }
        return null;
    }

    private static string? ReadString(JsonElement row, string name)
        => row.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private static int? ReadInt(JsonElement row, string name)
        => row.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var i) ? i : null;

    private static long? ReadLong(JsonElement row, string name)
        => row.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetInt64(out var l) ? l : null;

    private static DateTimeOffset? ReadDate(JsonElement row, string name)
    {
        var raw = ReadString(row, name);
        return DateTimeOffset.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed)
            ? parsed
            : null;
    }

    internal static string Compact(string? id)
        => string.IsNullOrWhiteSpace(id) ? "" : id.Replace("-", "", StringComparison.Ordinal).ToLowerInvariant();
}
