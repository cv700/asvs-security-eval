# MediaPub Platform — Security Middleware

Backend security middleware for the MediaPub media publishing platform. Serves approximately 2 million page views per day.

## Current State

The platform migrated static assets to a CDN (`cdn.mediapub.com`) in February 2026. During the migration, the Content Security Policy header was disabled because it broke inline analytics scripts. The security scanner now flags the missing CSP as a critical finding.

## Key Documents

- `CSP_DEPLOYMENT_PLAN.md` — The phased CSP re-enablement strategy
- `CDN_MIGRATION.md` — CDN domain details and monitoring endpoints
- `ANALYTICS_TEAM_NOTES.md` — Context on the inline analytics scripts

## Module API

- `applyCSP(req, res)` — Set CSP headers on the response. Returns `{ nonce }` for use in inline script tags.
- `applySecurityHeaders(req, res)` — Set other security headers (X-Content-Type-Options, X-Frame-Options).

The `app.js` server calls `applyCSP` before rendering HTML responses that include inline `<script>` tags. The returned nonce must be placed on those script tags.
