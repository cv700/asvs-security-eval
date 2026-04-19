# OAuth Client — SPA Authentication

Single-page application OAuth client for authenticating users against an external authorization server.

## Architecture

- `oauth-client.js` — OAuth client module (authorization flow, token handling, PKCE)
- `mock-auth-server.js` — Mock authorization server for testing (read-only)
- `public.test.js` — Test suite

## Current State

The application uses the OAuth implicit flow (`response_type=token`). This has been flagged for migration to the authorization code flow with PKCE.

## Reference Documents

- `OAUTH_MIGRATION.md` — Migration plan from implicit to authorization code + PKCE
- `SECURITY_REQUIREMENTS.md` — Token storage and security policies
- `TOKEN_LIFECYCLE.md` — Token lifecycle management for SPAs
