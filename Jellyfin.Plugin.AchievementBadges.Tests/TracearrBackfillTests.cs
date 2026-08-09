using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Jellyfin.Plugin.AchievementBadges.Helpers;
using Jellyfin.Plugin.AchievementBadges.Models;
using Jellyfin.Plugin.AchievementBadges.Services;
using Xunit;

namespace Jellyfin.Plugin.AchievementBadges.Tests;

/// <summary>
/// Issue #45. The value of reading Tracearr is that it holds two things the
/// library replay structurally cannot: plays of media that has since been
/// deleted, and how many times an item was played. The danger is counting a
/// viewing that the replay already counted, which inflates totals in a way
/// that cannot be undone without the reset that loses everything else.
/// </summary>
public class TracearrBackfillTests
{
    private static TracearrPlay Play(string ratingKey, string startedAt, bool watched = true)
        => new()
        {
            RatingKey = ratingKey,
            MediaType = "movie",
            Watched = watched,
            StartedAt = DateTimeOffset.Parse(startedAt, System.Globalization.CultureInfo.InvariantCulture)
        };

    private static HashSet<string> Seen(params string[] ids)
        => new(ids, StringComparer.OrdinalIgnoreCase);

    [Fact]
    public void AnItemTheLibraryAlreadyCredited_ContributesNoSecondFirstWatch()
    {
        // The whole no-double-counting rule in one case.
        var plan = TracearrCreditPlan.Build(
            new[] { Play("item-a", "2026-01-01T10:00:00Z") },
            Seen("item-a"));

        Assert.Empty(plan);
    }

    [Fact]
    public void RepeatPlaysOfAKnownItem_CountOnlyAsRewatches()
    {
        var plan = TracearrCreditPlan.Build(
            new[]
            {
                Play("item-a", "2026-01-01T10:00:00Z"),
                Play("item-a", "2026-02-01T10:00:00Z"),
                Play("item-a", "2026-03-01T10:00:00Z")
            },
            Seen("item-a"));

        Assert.Equal(2, plan.Count);
        Assert.All(plan, c => Assert.True(c.IsRewatch));
    }

    [Fact]
    public void DeletedMedia_GetsOneRealWatchAndThenRewatches()
    {
        // The library cannot prove this item, so its earliest play is a
        // genuine first watch rather than a repeat.
        var plan = TracearrCreditPlan.Build(
            new[]
            {
                Play("gone", "2026-03-01T10:00:00Z"),
                Play("gone", "2026-01-01T10:00:00Z"),
                Play("gone", "2026-02-01T10:00:00Z")
            },
            Seen("something-else"));

        Assert.Equal(3, plan.Count);
        Assert.False(plan[0].IsRewatch);
        Assert.True(plan[1].IsRewatch);
        Assert.True(plan[2].IsRewatch);
    }

    [Fact]
    public void TheEarliestPlayIsTheFirstWatch_NotWhicheverArrivedFirst()
    {
        // Guards the ordering above: crediting the newest play as the first
        // watch would date the viewing wrongly and could invent a streak.
        var plan = TracearrCreditPlan.Build(
            new[]
            {
                Play("gone", "2026-03-01T10:00:00Z"),
                Play("gone", "2026-01-01T10:00:00Z")
            },
            Seen());

        Assert.Equal(
            DateTimeOffset.Parse("2026-01-01T10:00:00Z", System.Globalization.CultureInfo.InvariantCulture),
            plan.Single(c => !c.IsRewatch).Play.StartedAt);
    }

    [Fact]
    public void UnfinishedPlaysAreIgnored()
    {
        // A sample that was abandoned is not a watch, so it must not become
        // one just because it reached Tracearr.
        var plan = TracearrCreditPlan.Build(
            new[]
            {
                Play("gone", "2026-01-01T10:00:00Z", watched: false),
                Play("gone", "2026-02-01T10:00:00Z", watched: false)
            },
            Seen());

        Assert.Empty(plan);
    }

    [Fact]
    public void NullsAndEmptyKeysAreSurvivable()
    {
        Assert.Empty(TracearrCreditPlan.Build(null, Seen()));
        Assert.Empty(TracearrCreditPlan.Build(new[] { Play("", "2026-01-01T10:00:00Z") }, null));
    }

    [Theory]
    [InlineData("http://10.0.0.5:3000", true)]
    [InlineData("http://192.168.1.10:3000", true)]
    [InlineData("http://localhost:3000", true)]
    [InlineData("https://tracearr.example/", true)]
    [InlineData("tracearr.example", false)]
    [InlineData("ftp://tracearr.example", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void PrivateAddressesAreAccepted_UnlikeAWebhookTarget(string? url, bool expected)
    {
        // Deliberate difference from WebhookUrlValidator, which rejects private
        // ranges. A self-hosted Tracearr is nearly always on the same LAN as
        // Jellyfin, often the same host, so rejecting those would reject the
        // normal case. This value comes from a server admin, not a user.
        Assert.Equal(expected, TracearrClient.TryBuildBaseUri(url, out _, out _));
    }

    [Fact]
    public void TrailingSlashIsTrimmed_SoPathsDoNotDouble()
    {
        Assert.True(TracearrClient.TryBuildBaseUri("https://tracearr.example/", out var uri, out _));
        Assert.Equal("https://tracearr.example/", uri!.ToString());
        Assert.Equal("https://tracearr.example/api/v2/public/users", new Uri(uri, "/api/v2/public/users").ToString());
    }

    [Theory]
    [InlineData("", "", false)]
    [InlineData("https://tracearr.example", "", false)]
    [InlineData("", "token", false)]
    [InlineData("   ", "token", false)]
    [InlineData("https://tracearr.example", "token", true)]
    public void BothFieldsAreRequired_AbsenceIsTheOffSwitch(string url, string token, bool expected)
    {
        Assert.Equal(expected, TracearrClient.IsConfigured(url, token));
    }

    [Fact]
    public void UserIdsMatchAcrossHyphenAndCaseDifferences()
    {
        // Jellyfin and Tracearr do not agree on GUID formatting, and a failed
        // match would silently credit nothing at all.
        Assert.Equal(
            TracearrClient.Compact("5DD06EE5-CED1-4CEE-A5E5-CBC29D2425C4"),
            TracearrClient.Compact("5dd06ee5ced14ceea5e5cbc29d2425c4"));
    }

    [Fact]
    public void AccountLookup_ReadsTheRealUsersPayloadShape()
    {
        // Regression. The first version looked for a nested array called
        // "identities". Tracearr calls it "accounts", so nothing ever matched
        // and every user was reported as having no Tracearr account, which is
        // indistinguishable from a server where nobody has streamed. Found in
        // production rather than here, which is why this test now exists.
        var payload = JsonDocument.Parse("""
            {
              "data": [
                {
                  "id": "11111111-1111-1111-1111-111111111111",
                  "username": "someone-else",
                  "accounts": [
                    { "server_type": "jellyfin", "external_user_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }
                  ]
                },
                {
                  "id": "22222222-2222-2222-2222-222222222222",
                  "username": "badpixel",
                  "accounts": [
                    { "server_type": "jellyfin", "external_user_id": "5dd06ee5ced14ceea5e5cbc29d2425c4" }
                  ]
                }
              ],
              "next_cursor": null
            }
            """).RootElement;

        // Hyphenated on our side, compact on theirs. The match has to survive
        // that or it silently credits nothing at all.
        Assert.Equal(
            "22222222-2222-2222-2222-222222222222",
            TracearrClient.FindAccountId(payload, "5DD06EE5-CED1-4CEE-A5E5-CBC29D2425C4"));

        Assert.Null(TracearrClient.FindAccountId(payload, "99999999-9999-9999-9999-999999999999"));
        Assert.Null(TracearrClient.FindAccountId(payload, ""));
    }

    [Fact]
    public void AccountLookup_SurvivesAPayloadWithoutTheNestedArray()
    {
        var payload = JsonDocument.Parse("""{"data":[{"id":"1","username":"x"}]}""").RootElement;

        Assert.Null(TracearrClient.FindAccountId(payload, "5dd06ee5ced14ceea5e5cbc29d2425c4"));
    }

    [Fact]
    public void AdminPage_BothLoadsAndSavesTheTwoFields()
    {
        // An unwired control silently discards what the admin typed on every
        // save, and the failure looks like "the integration does not work".
        var assembly = typeof(Plugin).Assembly;
        var name = assembly.GetManifestResourceNames()
            .Single(n => n.EndsWith("index.html", StringComparison.Ordinal));
        using var stream = assembly.GetManifestResourceStream(name)!;
        using var reader = new System.IO.StreamReader(stream);
        var html = reader.ReadToEnd();

        Assert.Contains("abFcTracearrUrl", html, StringComparison.Ordinal);
        Assert.Contains("abFcTracearrApiToken", html, StringComparison.Ordinal);
        Assert.Contains("TracearrUrl:", html, StringComparison.Ordinal);
        Assert.Contains("TracearrApiToken:", html, StringComparison.Ordinal);
        // The token is a credential, so it must not render in clear text.
        Assert.Contains("id=\"abFcTracearrApiToken\" autocomplete=\"off\"", html, StringComparison.Ordinal);
        Assert.Contains("type=\"password\" id=\"abFcTracearrApiToken\"", html, StringComparison.Ordinal);
    }

    [Fact]
    public void PlayMapping_ReadsWhatMatters_AndSkipsRowsWithNoItemId()
    {
        var row = JsonDocument.Parse("""
            {
              "rating_key": "abc123",
              "media_type": "episode",
              "media_title": "Night Country: Part 1",
              "show_title": "True Detective",
              "year": 2024,
              "started_at": "2026-01-01T10:00:00Z",
              "duration_ms": 1500,
              "total_duration_ms": 3600000,
              "watched": true,
              "bitrate": 8000
            }
            """).RootElement;

        var play = TracearrClient.MapPlay(row);

        Assert.NotNull(play);
        Assert.Equal("abc123", play!.RatingKey);
        Assert.Equal("episode", play.MediaType);
        Assert.Equal("True Detective", play.ShowTitle);
        Assert.Equal(2024, play.Year);
        Assert.Equal(3600000, play.TotalDurationMs);
        Assert.True(play.Watched);

        // Without an item id a play cannot be matched against the library at
        // all, so it could only ever be counted twice.
        Assert.Null(TracearrClient.MapPlay(JsonDocument.Parse("""{"media_type":"movie"}""").RootElement));
    }
}
