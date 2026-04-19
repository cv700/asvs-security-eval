# Rate Limiting Plan -- Login Endpoint

## Keying Strategy

Rate limit by **IP + username** combination, NOT by IP alone.

Reason: Many corporate customers share a single public IP (NAT). Limiting per-IP-only would lock out entire offices after one user's failed attempts. A single NAT IP may serve 200+ employees.

The rate limit key must combine both the originating IP address and the target username.

## Threshold

5 failed login attempts per IP+username combination within a 10-minute window.

## Lockout Behavior

After 5 failed attempts, the account+IP combination is locked for an escalating period:

- After 5 cumulative fails: 1-minute lockout
- After 10 cumulative fails: 5-minute lockout
- After 15 cumulative fails: 15-minute lockout

This is **exponential backoff**, NOT permanent lockout. The lockout duration increases with repeated abuse but always has a finite expiry. After the backoff period expires and a successful login occurs, the failure counter resets.

## Successful Login Reset

A successful login resets the failure counter for that IP+username combination entirely. This prevents legitimate users from accumulating stale failure counts over time.

## Rate Limit Headers

Responses must include rate limit metadata:

- `rateLimitRemaining` -- Number of attempts remaining before lockout
- `rateLimitReset` -- Unix timestamp (ms) of when the current lockout expires (0 if not locked)

Include these fields in the return value from the login function.

## Logging

Failed attempts must be recorded with:
- Timestamp
- IP address
- Username

Do NOT log the attempted password. Store failed attempt records in an audit log for post-incident analysis.
