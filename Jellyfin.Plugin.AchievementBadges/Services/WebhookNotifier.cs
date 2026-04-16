using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AchievementBadges.Services;

public class WebhookNotifier
{
    // Disable auto-redirects — WebhookUrlValidator only vets the initial URL,
    // so a malicious webhook server could otherwise 302-redirect us to a
    // private-range address (cloud metadata, localhost Jellyfin API, etc).
    private static readonly HttpClient _http = new(new HttpClientHandler
    {
        AllowAutoRedirect = false
    })
    { Timeout = TimeSpan.FromSeconds(10) };
    private readonly ILogger<WebhookNotifier> _logger;

    public WebhookNotifier(ILogger<WebhookNotifier> logger)
    {
        _logger = logger;
    }

    public void NotifyUnlock(string userName, AchievementBadge badge)
    {
        var config = Plugin.Instance?.Configuration;
        if (config is null || !config.WebhookEnabled || string.IsNullOrWhiteSpace(config.WebhookUrl))
        {
            return;
        }

        // Re-validate the URL immediately before sending to catch DNS rebinding
        // or cases where admin changed the stored URL out-of-band.
        if (!WebhookUrlValidator.TryValidate(config.WebhookUrl, out var error))
        {
            _logger.LogWarning("[AchievementBadges] Webhook URL failed validation: {Error}", error);
            return;
        }

        var template = string.IsNullOrWhiteSpace(config.WebhookMessageTemplate)
            ? "{user} unlocked {badge}"
            : config.WebhookMessageTemplate!;

        var safeUser = Sanitize(userName);
        var safeTitle = Sanitize(badge.Title);
        var safeRarity = Sanitize(badge.Rarity);
        var safeDescription = Sanitize(badge.Description);

        var content = template
            .Replace("{user}", string.IsNullOrEmpty(safeUser) ? "Someone" : safeUser, StringComparison.OrdinalIgnoreCase)
            .Replace("{badge}", string.IsNullOrEmpty(safeTitle) ? "a badge" : safeTitle, StringComparison.OrdinalIgnoreCase)
            .Replace("{rarity}", string.IsNullOrEmpty(safeRarity) ? "Common" : safeRarity, StringComparison.OrdinalIgnoreCase)
            .Replace("{description}", safeDescription, StringComparison.OrdinalIgnoreCase);

        var url = config.WebhookUrl!;
        object payload;
        if (url.Contains("hooks.slack.com", StringComparison.OrdinalIgnoreCase))
        {
            payload = new { text = content };
        }
        else
        {
            // Default Discord / generic format
            payload = new { content };
        }

        _ = Task.Run(async () =>
        {
            try
            {
                var json = JsonSerializer.Serialize(payload);
                using var req = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };
                using var res = await _http.SendAsync(req).ConfigureAwait(false);
                if (!res.IsSuccessStatusCode)
                {
                    _logger.LogWarning("[AchievementBadges] Webhook POST returned {Status}", (int)res.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[AchievementBadges] Webhook POST failed.");
            }
        });
    }

    private static string Sanitize(string? s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        var sb = new System.Text.StringBuilder(s.Length);
        foreach (var c in s)
        {
            if (c == '\r' || c == '\n' || c == '\t') sb.Append(' ');
            else if (!char.IsControl(c)) sb.Append(c);
        }
        return sb.ToString();
    }
}
