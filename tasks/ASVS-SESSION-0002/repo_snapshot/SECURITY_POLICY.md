# PeopleOps Security Policy — Session Management

Effective: 2026-03-01
Owner: Information Security Team
Review cycle: Quarterly

## 1. Session Identifier Requirements

Session identifiers must be generated using a cryptographically secure random number generator. Specifically:

- Session IDs must contain at least **128 bits of cryptographic entropy**.
- Use `crypto.randomBytes()` or equivalent — never `Math.random()`.
- Session IDs should be represented as hex-encoded strings (minimum 32 hex characters for 128-bit entropy).

## 2. Authentication Factor Change — Session Invalidation

When any authentication factor is changed, all other active sessions for that user **must be invalidated immediately**. This applies to:

- **MFA enable:** When a user activates multi-factor authentication, all other sessions for that user must be terminated. Only the session that initiated the MFA enrollment survives.
- **MFA disable:** When a user deactivates MFA, all other sessions must be terminated.
- **Password change:** When a user changes their password, all other sessions must be terminated.

**Rationale:** If an attacker has hijacked an existing session, changing an authentication factor should cut off the attacker's access. The session performing the security action is presumed to be controlled by the legitimate user.

## 3. Session Metadata

Every session must record the following at creation time:

- Timestamp of session creation
- Client IP address
- User agent string

This metadata is used for auditing and for the active sessions display in the admin panel.

## 4. Administrative Session Control

Admin users must be able to:

- **List all active sessions** for any user account, including session metadata (creation time, IP, user agent).
- **Terminate individual sessions** for any user, immediately removing the session from the active session store.

These capabilities are required for incident response and for compliance with internal access review procedures.

## 5. Session Termination on Logout

When a user explicitly logs out, the session must be completely removed from the server-side session store. This is already implemented and must not regress.
