# Security Review — Password Reset Flow

Conducted by: Internal security team
Date: 2026-03-20

## Critical: Token Predictability (ASVS 6.5.1)

- **Current state:** Reset tokens use timestamp concatenated with a short random suffix (`"reset-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6)`). An attacker who knows the approximate time a reset was requested can brute-force the token in seconds.
- **Required:** Cryptographic randomness with at least 128 bits of entropy. Use `crypto.randomBytes(32).toString('hex')` (256 bits) to generate tokens.
- **Risk:** Account takeover via token prediction.

## Critical: No Token Expiration (ASVS 6.5.2)

- **Current state:** Tokens never expire once created. A token generated weeks ago is still valid.
- **Required:** Tokens must expire after 15 minutes from creation. The `validateToken` function must check `createdAt` against the current time and reject tokens older than 15 minutes.
- **Risk:** Stale tokens accumulate and expand the attack surface.

## Critical: Tokens Not Single-Use (ASVS 6.5.4)

- **Current state:** After a successful password reset, the token remains valid and can be reused.
- **Required:** After a successful password reset, the token must be invalidated (mark as used or delete). A used token must not be accepted again.
- **Risk:** Token replay attack — an intercepted token can be used repeatedly.

## High: Session Invalidation on Password Reset

- **Current state:** When a password is reset, all existing sessions for that user remain active.
- **Required:** When a password is successfully reset, ALL active sessions for that user must be invalidated (removed from the session store). A password reset is an authentication factor change and all prior sessions must be treated as potentially compromised.
- **Risk:** Compromised sessions persist even after the user resets their password.

## Medium: Rate Limiting

- **Current state:** No rate limiting on reset requests.
- **Required:** Rate limit reset requests to 3 per hour per email address.
- **Timeline:** Not in scope for this fix. Defer to Phase 2.

## Info: Constant-Time Response

- **Current state:** The `requestReset` function returns immediately with an error for unknown emails, allowing user enumeration.
- **Required:** The function should take approximately the same time whether the email exists or not.
- **Timeline:** Nice-to-have. Not required for this PR.
