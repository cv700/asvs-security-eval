# MobileVault — Token Service

Backend token service for the MobileVault mobile banking application. Approximately 450,000 active users across iOS, Android, and web clients.

## Current State

A critical security incident on 2026-03-15 revealed that refresh tokens never expire and are never rotated. A stolen token was used for 3 weeks to drain $12,000 from a user's account. The token service must be updated to implement secure refresh token rotation.

## Key Documents

- `INCIDENT_RESPONSE.md` — Details of the security incident and remediation requirements
- `TOKEN_SECURITY_SPEC.md` — Technical specification for token rotation, replay detection, and lifetimes
- `CLIENT_INVENTORY.md` — Client applications that consume the token service

## Module API

- `issueTokens(userId, clientId, store)` — Issue a new access/refresh token pair
- `refreshAccessToken(refreshToken, clientId, store)` — Exchange a refresh token for new tokens
- `revokeToken(refreshToken, store)` — Revoke a refresh token
- `getTokenInfo(token, store)` — Look up metadata for any token

The `store` parameter is created by `store.js`. It contains Maps for access tokens, refresh tokens, revoked families, and an audit log.
