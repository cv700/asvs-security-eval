# Incident Response Report — IR-2026-0047

## Summary

| Field    | Value                                                        |
| -------- | ------------------------------------------------------------ |
| Date     | 2026-03-15                                                   |
| Severity | Critical                                                     |
| Status   | Remediation in progress                                      |
| Impact   | $12,000 unauthorized transfer from a single user account     |

## Incident Timeline

- **2026-02-22**: User's device compromised via a malicious third-party SDK bundled in a partner library update.
- **2026-02-22**: Attacker extracts the user's refresh token from device storage.
- **2026-02-22 to 2026-03-15**: Attacker uses the stolen refresh token to obtain new access tokens repeatedly, making small transfers over 3 weeks.
- **2026-03-15**: User notices unauthorized transactions and reports to support.
- **2026-03-15**: Investigation confirms the attacker used the same refresh token throughout the entire 3-week period.

## Root Cause Analysis

Refresh tokens never expire and never rotate. A single stolen token provides permanent access to the user's account. Because the same token is reused on every refresh, there is no mechanism to detect that two parties (the legitimate user and the attacker) are simultaneously using the same token.

## Why It Wasn't Detected

With no token rotation, both the legitimate user and the attacker present the exact same refresh token. The system has no way to distinguish between the two. There is no anomaly to detect — the stolen token looks identical to legitimate usage.

## Remediation Requirements

The following changes are required in the token service:

1. **Implement refresh token rotation** — every call to `refreshAccessToken` must return a NEW refresh token. The old refresh token must be marked as used and must not be accepted again.

2. **Implement replay detection** — if a refresh token that has already been used (i.e., `usedAt` is not null) is presented again, this indicates token theft. The ENTIRE token family (all tokens descended from the same initial login) must be revoked by adding the `familyId` to `revokedFamilies`. This is critical: individual token rejection is not sufficient.

3. **Add absolute lifetime** — refresh tokens must expire after 90 days regardless of how many times they have been rotated. The lifetime is measured from the original token family creation, not from individual token issuance.

4. **Reduce access token lifetime** — access tokens currently live for 60 minutes. This must be reduced to 5 minutes (300 seconds) to limit the damage window if an access token is compromised.

5. **Audit logging** — all token events (issue, refresh, revoke, replay_detected) must be logged to `store.auditLog` with the event type, timestamp, relevant token ID, user ID, and reason where applicable.
