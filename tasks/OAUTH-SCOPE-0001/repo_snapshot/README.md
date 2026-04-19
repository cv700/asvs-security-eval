# API Platform — OAuth Scope Service

OAuth scope validation and token issuance for a multi-tenant API platform. Approximately 15 third-party integrations, 500+ active users across all clients.

## Current State

The platform launched with coarse-grained OAuth scopes (`read`, `write`, `admin`). A migration to fine-grained scopes (`projects:read`, `projects:write`, `users:read`, etc.) began on 2026-01-01. The scope validation module was updated to use the new format, but third-party applications that still send old scope strings are now receiving 400 errors.

## Key Documents

- `SCOPE_MIGRATION.md` — The migration plan: scope mapping, token format, transition rules
- `API_DEPRECATION_POLICY.md` — 12-month backward compatibility commitment
- `THIRD_PARTY_REGISTRY.md` — Third-party client inventory and migration status

## Module API

- `validateScopes(requestedScopes, clientId, store)` — Validate requested scopes against the client's approved scopes
- `issueToken(requestedScopes, clientId, store)` — Validate scopes and issue an access token
- `refreshWithScopes(refreshToken, store)` — Issue a new access token using a refresh token
- `getGrantedScopes(clientId, store)` — Return the client's approved scopes in new format

The `store` parameter is created by `store.js`. It contains the scope mapping, client registry, and active refresh tokens.
