# Security

## Reporting a vulnerability

Please add **zack1544** on Discord with the subject `[AchievementBadges] security`
before opening a public issue.

| Stage | SLA |
|---|---|
| Acknowledgement | 72 hours |
| Initial assessment | 7 days |
| Patched release for confirmed vulnerabilities | 14 days |
| Public disclosure (CVE / advisory) | 30 days after patched release, or 90 days after report — whichever is sooner |

**Safe-harbour for researchers:** good-faith testing against your own Jellyfin
server is welcome. Do not access other users' data, do not exfiltrate, do not
deploy the issue against servers you don't own. Provide a minimal repro and
we'll credit you in the advisory unless you'd rather stay anonymous.

---

## Threat model

### Trust boundaries

| Boundary | Whose data | Trust |
|---|---|---|
| **Jellyfin auth claim** (`Jellyfin-UserId`) | The signed-in user | Trusted (signed by Jellyfin core) |
| **Route `{userId}` parameter** | Caller-supplied | **Untrusted until verified by `UserOwnershipFilter`** |
| **`[RequiresElevation]` policy** | Admin-only writes | Trusted via Jellyfin's `Administrator` role check |
| **Admin-uploaded SVG** | Untrusted markup | Sanitised by `Helpers/SvgSanitizer` |
| **Admin-configured webhook URL** | Untrusted host | Validated by `Helpers/WebhookUrlValidator` (private-IP/loopback/link-local block; redirects disabled; re-validated immediately before each send) |
| **Outbound webhook receiver** | Third party | Treated as untrusted — never reflects sensitive data |
| **`badges.json` / `audit.json` / `messaging.json` on disk** | Plugin-owned | Trusted; readable only by the Jellyfin process |

### In scope

- Code injection (XSS, HTML injection, SVG-borne script)
- Authentication bypass / privilege escalation
- Cross-user data access (the only authz check users see)
- SSRF via webhook URL
- XXE via SVG / config XML
- Insecure deserialization (`System.Text.Json` only — no Newtonsoft polymorphism)
- Path traversal (only one route exposes a path-derived parameter — `client-script/{name}`, character-whitelisted)
- Resource exhaustion (memory) via authenticated user passing huge `pageSize` / `limit`
- Dependency CVEs in transitive packages

### Out of scope

- Compromise of the host operating system, container, or Jellyfin core process
- Vulnerabilities in Jellyfin itself (report to upstream)
- Phishing / social engineering of admins
- Physical access to the server
- Network man-in-the-middle (mitigated by HTTPS at the reverse-proxy layer; not the plugin's responsibility)
- Browser extensions running in the admin's session

---

## Defences in place

### Authentication

The plugin relies entirely on Jellyfin's built-in authentication. All write
endpoints are marked `[Authorize]` (most also `[ServiceFilter(typeof(UserOwnershipFilter))]`
or `[Authorize(Policy = "RequiresElevation")]` for admin routes), which means
Jellyfin validates the `X-Emby-Token` / `X-MediaBrowser-Token` header on every
request before our code runs.

### Cross-user isolation

`Api/UserOwnershipFilter.cs` runs on every action of the controller. It:

1. Reads the caller's `Jellyfin-UserId` claim.
2. Reads the route's `{userId}` parameter.
3. Compares them as **GUIDs structurally** (not case-insensitive string equality).
4. Allows admins (`RequiresElevation`) to bypass the comparison.
5. Returns `403 Forbidden` on mismatch.

This is the single biggest authz mistake plugins make and it is enforced
uniformly here — a regression test in `SecurityTests` would catch any
loosening.

### CSRF

Jellyfin uses a **header-based** auth token (`X-Emby-Token`), **not cookies**.
This structurally mitigates cross-site request forgery (custom headers
cannot be attached cross-origin without a successful CORS preflight; the
plugin sets no cookies and accepts no query-string auth).

### Rate limiting

Default policy `user-60-per-min` applies to **every** route in the controller
(class-level `[EnableRateLimiting]` since v1.8.59). Stricter overrides on
hot paths:

- `RecomputeLibraryCompletion` — 1/5min/user
- `Prestige` — 1/hour/user
- Anonymous `GetProfileCard` — 30/min/IP

### Input bounding

Pagination and message-history routes clamp `page` / `pageSize` / `limit`
explicitly (see `GetActivityFeed`, `GetMessageThread`, `GetConvMessages`,
`GetStreakCalendar`, `GetBadgeEtas`). `MessagingService` enforces 1000-char
text, 2000 messages/conversation, 20 group participants, 8 MB attachments.

### SSRF defence (webhooks)

`Helpers/WebhookUrlValidator`:

- Rejects non-`http`/`https` schemes
- Resolves the host and rejects loopback, RFC1918 (10/8, 172.16/12, 192.168/16),
  link-local (169.254/16), unspecified (0.0.0.0), IPv6 loopback (`::1`),
  IPv6 link-local (`fe80::/10`), IPv6 unique-local (`fc00::/7`)
- **Fails closed** on DNS errors and zero-resolution hosts (since v1.8.58)

`Services/WebhookNotifier`:

- `HttpClient` has `AllowAutoRedirect = false` (no redirect-based bypass)
- Re-validates the URL **immediately before each send** (catches DNS rebinding
  / config-changed-while-running)
- Sanitises content (strips control characters from user/badge text)
- 10-second timeout

### Webhook authenticity (since v1.8.59)

When admin sets `WebhookSigningSecret`, every outbound POST carries:

```
X-AchievementBadges-Signature: sha256=<hex>
X-AchievementBadges-Timestamp: <unix-seconds>
```

Receivers verify with `HMAC-SHA256(secret, "<timestamp>." + raw_body)`.
Stale timestamps should be rejected to prevent replay. Same envelope as
Stripe / GitHub.

### SVG upload sanitisation

`Helpers/SvgSanitizer`:

- 100 KB size cap
- `XmlReader` with `DtdProcessing.Prohibit`, `XmlResolver = null`,
  `MaxCharactersFromEntities = 0` (XXE-immune)
- Rejects `<script>`, `<foreignObject>`, `<iframe>`, `<embed>`, `<object>`
- Rejects any `on*` event-handler attribute
- Rejects `javascript:` and `data:text/html` URIs
- `<use>` allowed only with same-document `#anchor` href

### Path traversal

Only one route accepts a path-shaped parameter: `client-script/{name}`. It
character-whitelists `IsLetterOrDigit | '-' | '_'` before any I/O and reads
from embedded resources via `assembly.GetManifestResourceStream`, never
from the filesystem.

### Anonymous endpoint hardening

`GetProfileCard` is the only anonymous endpoint and serves HTML. Since v1.8.59
it sets:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; …
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: same-origin
Permissions-Policy: interest-cohort=()
```

### Audit logging

Every action under the `RequiresElevation` policy is captured by
`Api/AdminAuditLogFilter` (since v1.8.59) into `audit.json`:

```json
{
  "At": "2026-05-03T15:30:00Z",
  "UserId": "<guid>",
  "UserName": "<name or [redacted]>",
  "Type": "admin.action",
  "Details": "POST /Plugins/AchievementBadges/users/<guid>/unlock/binge_god -> 200"
}
```

Capped at 5000 entries (FIFO eviction). Admins can enable
`RedactUsernamesInAuditLog` to store only the GUID.

### Privacy controls

Per-user prefs (`Models/UserAchievementProfile.UserNotificationPreferences`):

- `AppearOffline` — masks online state in the friends drawer
- `HideNowPlaying` — hides the live "Watching X" line
- `HideLastWatched` — hides the offline last-watched echo (since v1.8.56)

Each is honoured server-side in `FriendsService.BuildFriendRow` before any
data is computed or returned.

### Logging

Application logs contain Jellyfin-internal `UserId` GUIDs and badge IDs
only. The codebase does not log tokens, passwords, API keys, or
`Authorization` headers. Exception messages and stack traces never leak
into HTTP responses.

### Deserialisation

All JSON deserialisation uses `System.Text.Json`, never with type
discriminators or `TypeNameHandling`. Not vulnerable to the polymorphic
deserialisation gadget chains that affect Newtonsoft.Json with
`TypeNameHandling.All`.

---

## Continuous verification

| Check | Where | Cadence |
|---|---|---|
| Security regression tests | `Jellyfin.Plugin.AchievementBadges.Tests/SecurityTests.cs` | Every push, every PR |
| Dependency CVE scan | `dotnet list package --vulnerable --include-transitive` | Every push, every PR, weekly cron |
| Deprecated package warning | `dotnet list package --deprecated` | Every push, every PR, weekly cron |
| Secret scan | `gitleaks` action | Every push, every PR |

CI fails on any High / Critical / Moderate CVE in transitive deps. Workflow
lives in `.github/workflows/security.yml`.

---

## Past advisories

None to date. This file will list any disclosed issues with CVE IDs once
they exist.
