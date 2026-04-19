# CORS Policy — ProjectBoard API

**Effective:** 2026-02-20
**Owner:** Platform Security Team
**Applies to:** api.example.com

## Allowed Origins

Only the following origins are permitted to make cross-origin requests:

- `https://app.example.com` (React SPA — primary frontend)
- `https://admin.example.com` (Admin panel)

Requests from any other origin must not receive CORS headers. Do not return a 403 or error — simply omit all `Access-Control-*` headers so the browser's same-origin policy blocks the request silently.

## Credentials

The API uses HTTP-only session cookies for authentication. Cross-origin requests must include credentials.

- Set `Access-Control-Allow-Credentials: true` on responses to allowed origins.
- When credentials mode is enabled, `Access-Control-Allow-Origin` **must** echo the specific requesting origin. Browsers silently reject responses with `Access-Control-Allow-Origin: *` when credentials are included.

## Allowed Methods

`GET, POST, PUT, DELETE, OPTIONS`

## Allowed Headers

`Content-Type, Authorization, X-Request-ID`

## Preflight Caching

- `Access-Control-Max-Age: 3600` (1 hour)
- Do not exceed this value. Security policy limits how long browsers may cache preflight results to ensure policy changes propagate within one hour.

## Cache Poisoning Prevention

**Critical:** Every response that includes CORS headers must also include `Vary: Origin`.

Without `Vary: Origin`, an intermediary cache (CDN, proxy) may store a CORS response keyed to one origin and serve it to a different origin. This creates a cache poisoning vector where:

1. Attacker requests from `https://evil.com` — no CORS headers cached
2. Legitimate user requests from `https://app.example.com` — gets the cached no-CORS response, request fails

Or the reverse: a cached response with `Access-Control-Allow-Origin: https://app.example.com` is served to a request from `https://admin.example.com`, causing a mismatch.

`Vary: Origin` tells caches to key responses on the Origin header, preventing this class of attack.
