# Security Review — Achievement Badges for Jellyfin

**Date:** 2026-05-21
**Reviewer:** Automated review against `Jellyfin.Plugin.AchievementBadges/`
**Plugin version reviewed:** 1.9.6
**Scope:** Services, Api, Helpers, Configuration

---

## HIGH

### H1 — No per-user attachment storage quota
**File:** [Services/MessagingService.cs:574-614](Jellyfin.Plugin.AchievementBadges/Services/MessagingService.cs#L574-L614) (`SaveAttachment`)

Each upload is capped at 8 MB per file (`MaxAttachmentBytes = 8L * 1024 * 1024`) and each HTTP request is capped at 10 MB (`[RequestSizeLimit(10 * 1024 * 1024)]` in the controller). However, there is no cap on how many attachments a single user may upload over time. An authenticated user can repeatedly upload 8 MB files until disk space is exhausted. `_attachments` is never queried by `UploadedBy` before writing a new file.

**Fix:** Before writing in `SaveAttachment`, count existing attachments for `callerId`:
```csharp
var userCount = _attachments.Values.Count(a => NormalizeId(a.UploadedBy) == callerId);
if (userCount >= MaxAttachmentsPerUser) return (false, "Attachment quota reached.", null);
```
Add `internal const int MaxAttachmentsPerUser = 50;` or make it admin-configurable. Consider tracking total bytes stored per user as well.

### H2 — Audit-log `details` built with string concat from attacker-controlled usernames
**Files:** [Api/AchievementBadgesController.cs:1685](Jellyfin.Plugin.AchievementBadges/Api/AchievementBadgesController.cs#L1685), [Services/AchievementBadgeService.cs:543-544](Jellyfin.Plugin.AchievementBadges/Services/AchievementBadgeService.cs#L543-L544), [Services/AchievementBadgeService.cs:2312](Jellyfin.Plugin.AchievementBadges/Services/AchievementBadgeService.cs#L2312)

`AuditLogService.Log()` stores entries as structured JSON (file-level newline injection is not possible). However, the `details` argument is assembled by callers using `+` concatenation with values from `ResolveUserName()` (raw `Username` from the Jellyfin user record) and badge titles. A username containing `"` or structured `key=value` pairs could misrepresent log entry semantics if the log is ever parsed by tooling.

**Fix:** Sanitize / truncate free-form username strings before embedding them in `details`. Alternatively, adopt a structured `Details` object with typed fields rather than free-form string.

### H3 — Profile-card CSP allows `'unsafe-inline'` scripts
**File:** [Api/AchievementBadgesController.cs:1281](Jellyfin.Plugin.AchievementBadges/Api/AchievementBadgesController.cs#L1281)

The anonymous `GET /users/{userId}/profile-card` endpoint sets `script-src 'self' 'unsafe-inline'`. Badge titles and tier names are HTML-encoded via `WebUtility.HtmlEncode` (lines 1341, 1364-1367), so there is no immediate reflected XSS. But `'unsafe-inline'` removes the defence-in-depth CSP is supposed to provide should an encoding miss appear later.

**Fix:** Remove `'unsafe-inline'` from `script-src`. Move inline scripts in `profile-card.html` to a separate `.js` embedded resource, or use a nonce-based approach.

---

## MEDIUM

### M1 — Webhook signing secret stored in plaintext plugin config
**File:** [Services/WebhookNotifier.cs](Jellyfin.Plugin.AchievementBadges/Services/WebhookNotifier.cs), [Configuration/PluginConfiguration.cs:38](Jellyfin.Plugin.AchievementBadges/Configuration/PluginConfiguration.cs#L38)

The outbound webhook implementation correctly signs with HMAC-SHA256 over `<timestamp>.<body>` and includes `X-AchievementBadges-Timestamp` — receivers can implement replay protection. No inbound webhook receiver exists, so no constant-time comparison is needed on the plugin side. The HMAC key (`WebhookSigningSecret`) is stored in `PluginConfiguration` and serialized to disk alongside all other plugin config. If Jellyfin's plugin config directory is world-readable, the secret is exposed.

**Fix/Note:** Document that operators should ensure the plugin config directory is restricted to the Jellyfin process account. No plugin code change required.

### M2 — Synchronous DNS resolution on request thread
**File:** [Helpers/WebhookUrlValidator.cs:37](Jellyfin.Plugin.AchievementBadges/Helpers/WebhookUrlValidator.cs#L37)

```csharp
addresses = Dns.GetHostAddresses(uri.Host);
```
`Dns.GetHostAddresses` is synchronous. Called from `POST /admin/webhook` and (less impactfully) from `WebhookNotifier.NotifyUnlock`. A slow DNS server can stall the ASP.NET request thread for the default DNS timeout. Admin-only DoS, low severity.

**Fix:** Use `Dns.GetHostAddressesAsync` and make the validator async, or enforce a short timeout.

### M3 — `style-src 'unsafe-inline'` on anonymous profile-card endpoint
**File:** [Api/AchievementBadgesController.cs:1282](Jellyfin.Plugin.AchievementBadges/Api/AchievementBadgesController.cs#L1282)

Same endpoint as H3. `style-src 'unsafe-inline'` allows injected CSS — CSS-injection exfiltration attacks become possible in some browser contexts.

**Fix:** Extract inline styles to an embedded stylesheet resource.

---

## LOW

### L1 — SVG sanitizer does not strip `<animate>` / `<set>` elements
**File:** [Helpers/SvgSanitizer.cs:18](Jellyfin.Plugin.AchievementBadges/Helpers/SvgSanitizer.cs#L18)

Sanitizer correctly blocks `<script>`, `onclick`, `javascript:` URIs, and non-anchor `<use href>`. It does not block `<animate>` / `<set>` elements that can dynamically modify attributes at runtime (e.g., animate `href` to a `javascript:` URI on older SVG-capable clients).

**Fix:** Add `"animate"` and `"set"` to `DisallowedElements`, or reject `attributeName` values pointing to event handlers or URI attributes inside the attribute loop.

### L2 — `FriendsSimpleMode` enumerates all server users to any authenticated user
**File:** [Configuration/PluginConfiguration.cs:98-99](Jellyfin.Plugin.AchievementBadges/Configuration/PluginConfiguration.cs#L98-L99)

Opt-in admin toggle; when enabled, every authenticated user sees every Jellyfin account in the friends drawer. Privacy concern when accounts map to real identities.

**Fix:** Surface the implication prominently in admin UI before enable. Consider filtering to non-admin accounts only.

### L3 — `audit-log` endpoint `limit` parameter not clamped at controller layer
**File:** [Api/AchievementBadgesController.cs:1785](Jellyfin.Plugin.AchievementBadges/Api/AchievementBadgesController.cs#L1785)

`GetRecent` does `Math.Min(limit, count)` internally so practical max is `MaxEntries=5000`, but admin can pass `limit=2147483647`. Admin-only, low severity.

**Fix:** `limit = Math.Clamp(limit, 1, 1000);` in the controller action for consistency.

---

## INFO (clean / by-design)

- **I1 — Outbound webhook only, no inbound verification needed.** Replay protection is receiver's responsibility; plugin sends timestamp correctly.
- **I2 — No dangerous patterns found.** No `Process.Start`, `Assembly.Load`, `XmlDocument` (XXE), `TypeNameHandling.All`, or shell-out.
- **I3 — No hardcoded credentials.** `WebhookSigningSecret` defaults to empty string.
- **I4 — Path traversal protection on attachment filenames is correct.** `SafeFileName` strips invalid chars + truncates to 80. Files are saved as `<Guid>.<ext>` from validated MIME; caller filename is display-only.
- **I5 — `UserOwnershipFilter` enforces caller==userId on `{userId}` routes.** Filter at `Api/UserOwnershipFilter.cs` passes admin through, does GUID-structural comparison (case-variation safe). `/compare/{userIdA}/{userIdB}` has its own explicit check.
- **I6 — Server-wide endpoints (leaderboard, stats, activity-feed, recap) are authenticated but not user-scoped.** Appropriate — consistent with `ForcePrivacyMode` / `RestrictBadgeVisibility` toggles.

---

## Summary

| ID | Severity | File | Pattern |
|----|----------|------|---------|
| H1 | High | `MessagingService.cs:574` | No per-user attachment count/storage quota |
| H2 | High | `AchievementBadgesController.cs:1685`, `AchievementBadgeService.cs:543` | Audit log `details` built by string concat with username |
| H3 | High | `AchievementBadgesController.cs:1281` | `script-src 'unsafe-inline'` on anonymous HTML endpoint |
| M1 | Medium | `PluginConfiguration.cs:38` | Signing secret stored in plaintext plugin config file |
| M2 | Medium | `WebhookUrlValidator.cs:37` | Synchronous DNS resolution on request thread (admin-only DoS) |
| M3 | Medium | `AchievementBadgesController.cs:1282` | `style-src 'unsafe-inline'` on anonymous HTML endpoint |
| L1 | Low | `SvgSanitizer.cs:18` | `<animate>`/`<set>` not in `DisallowedElements` |
| L2 | Low | `PluginConfiguration.cs:98` | `FriendsSimpleMode` enumerates all server users |
| L3 | Low | `AchievementBadgesController.cs:1785` | Audit log `limit` parameter unbounded at controller layer |

**Recommended next release:** Address H1 (storage quota) and H3 (CSP scripts). H2 is parsing-ambiguity, not classic log injection — can wait. M1/M2/L1/L2/L3 are good cleanup for a future minor version.
