# Security

## Reporting a vulnerability

Please add **zack1544** on discord with the subject `[AchievementBadges] security`
before opening a public issue. We will acknowledge receipt within 72 hours and
aim to ship a patched release within 14 days for confirmed vulnerabilities.

## Threat model

### Authentication

The plugin relies entirely on Jellyfin's built-in authentication. All write
endpoints are marked `[Authorize]` (most also `[ServiceFilter(typeof(UserOwnershipFilter))]`
or `[Authorize(Policy = "RequiresElevation")]` for admin routes), which means
Jellyfin validates the `X-Emby-Token` / `X-MediaBrowser-Token` header on every
request before our code runs.

### CSRF

Jellyfin uses a **header-based** auth token (`X-Emby-Token`), **not cookies**.
This structurally mitigates cross-site request forgery:

- A CSRF attack works by getting the victim's browser to include an
  ambient credential (cookie) on a forged request to a third-party origin.
- Custom headers like `X-Emby-Token` cannot be attached to a cross-origin
  request without a successful CORS preflight.
- As long as Jellyfin's CORS policy stays restrictive (the default is
  same-origin only), the browser will refuse to attach the token to a
  request coming from attacker.example.
- The plugin does **not** set its own cookies for auth state and does
  **not** accept auth via query string, so there's no alternate vector.

Operators running Jellyfin behind a reverse proxy should keep the proxy's
CORS configuration conservative — i.e. don't add `Access-Control-Allow-Origin: *`
just to make a browser extension happy.

### Rate limiting (added in v1.6.0)

- `RecordCompletion` — 60 requests/minute per user
- Anonymous `GetProfileCard` — 30 requests/minute per IP
- `RecomputeLibraryCompletion` — 1 request per 5 minutes per user
- `Prestige` — 1 request per hour per user

### SVG upload sanitization

The admin Xbox-logo upload feature runs user-supplied SVG through
`Helpers/SvgSanitizer.cs`, which uses `XmlReader` with `DtdProcessing.Prohibit`
and `MaxCharactersFromEntities = 0`, rejects `<script>`, `<foreignObject>`,
`<iframe>`, `<embed>`, `<object>`, and `<use>` elements, any `on*` event handler
attributes, and `javascript:` / `data:text/html` URIs.

### Audit log redaction

Administrators can enable `RedactUsernamesInAuditLog` in the admin Feature
Controls to store only the UserId GUID in audit-log entries. The admin
endpoint returns `UserName = "[redacted]"` for redacted entries.
