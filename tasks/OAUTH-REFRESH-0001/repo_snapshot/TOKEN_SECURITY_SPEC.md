# Token Security Specification — MobileVault

## Refresh Token Rotation

Each call to `refreshAccessToken` must perform the following steps in order:

1. Validate the presented refresh token exists in the store.
2. Validate that the presenting `clientId` matches the token's bound `clientId`.
3. Check if the token's `familyId` is in `revokedFamilies`. If so, reject immediately.
4. Check if the token has already been used (`usedAt !== null`). If so, this is a replay — see Replay Detection below.
5. Check the absolute lifetime — see Absolute Lifetime below.
6. Mark the current refresh token as used (set `usedAt` to the current timestamp).
7. Generate a NEW refresh token in the **same family** (`familyId` must match).
8. The new token must carry the family's original creation timestamp (`familyCreatedAt`) for lifetime tracking.
9. Return the new refresh token and a new access token.

## Replay Detection

If a refresh token that has already been used (`usedAt !== null`) is presented:

1. This indicates token theft. Either the legitimate user or the attacker is replaying an already-consumed token.
2. **Revoke the entire token family** by adding the `familyId` to `store.revokedFamilies`.
3. All tokens in that family become immediately invalid (any subsequent refresh attempts with tokens in that family will fail at step 3 above).
4. Log the replay event to `store.auditLog` with `event: "replay_detected"` and `reason: "replay_detected"`.
5. Throw an error indicating the replay was detected.

**Important:** Simply rejecting the individual token is NOT sufficient. The entire family must be revoked to invalidate the token that the attacker (or legitimate user) still holds.

## Family Validation

Before processing any refresh request, check if the token's `familyId` exists in `store.revokedFamilies`. If it does, the request must be rejected immediately. This ensures that once a replay is detected, ALL tokens in the compromised family are invalidated.

## Absolute Lifetime

Refresh tokens must be rejected if the token family is older than 90 days (90 * 24 * 60 * 60 * 1000 milliseconds). The lifetime is measured from the family's original creation time (`familyCreatedAt`), NOT from the individual token's creation time. Each rotated token must carry the original family creation timestamp forward.

When a token exceeds its absolute lifetime, throw an error indicating expiration.

## Access Token Lifetime

Access tokens must have a lifetime of **5 minutes (300 seconds)**, not the current 60 minutes. This applies to both `issueTokens` and `refreshAccessToken`.

- `expiresAt` must be set to `Date.now() + 5 * 60 * 1000`
- The `expires_in` field in the response must be `300`

## Client Binding

Refresh tokens are bound to a specific `clientId` at issuance. Any refresh attempt must validate that the presenting client matches the token's bound client. Mismatches must be rejected.

## Audit Logging

All token lifecycle events must be logged to `store.auditLog`. Each log entry should include:

- `event` — one of: `"issue"`, `"refresh"`, `"revoke"`, `"replay_detected"`
- `timestamp` — `Date.now()`
- `tokenId` — the relevant token identifier
- `userId` — the user associated with the token
- `reason` — descriptive reason (especially important for `"replay_detected"` events)
