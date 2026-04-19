# API Deprecation Policy

## Scope Format Changes

- **12-month backward compatibility** for scope format changes during the transition period (2026-01-01 to 2026-12-31).
- After 12 months, old scopes will return 400 errors (current behavior becomes intentional).
- Clients are notified via email and API response headers: `Deprecation: true` and `Sunset: 2026-12-31`.
- The `scope` field in token responses is authoritative — clients should update their scope handling to use the values from token responses, not their original request.

## General Deprecation Rules

- All breaking changes require minimum 12-month deprecation period.
- Sunset dates must be communicated in API response headers.
- Usage analytics must be collected to track migration progress.
