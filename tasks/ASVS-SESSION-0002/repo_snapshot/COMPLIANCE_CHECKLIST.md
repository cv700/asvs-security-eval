# ASVS Compliance Checklist — Session Management

Application: PeopleOps HR Portal
Standard: OWASP ASVS v5.0, Chapter 7 (Session Management)
Review date: 2026-03-15
Reviewer: Security Engineering

## Session ID Generation

| Requirement | ASVS Ref | Status |
|---|---|---|
| Session IDs generated using CSPRNG with >= 128 bits of entropy | 7.1.1 | FAIL |
| Session IDs not included in URLs | 7.1.2 | PASS |

**7.1.1 Notes:** Current implementation uses `Math.random().toString(36).substring(2)` which provides approximately 48 bits of entropy from a non-cryptographic PRNG. Must be replaced with `crypto.randomBytes(16)` or equivalent (128 bits = 16 bytes = 32 hex characters).

## Session Lifecycle

| Requirement | ASVS Ref | Status |
|---|---|---|
| Session invalidated on logout | 7.2.1 | PASS |
| Session timeout after inactivity | 7.3.1 | N/A (deferred) |
| All sessions invalidated on auth factor change | 7.4.1 | FAIL |
| Mechanism to view and terminate active sessions | 7.4.2 | FAIL |

**7.4.1 Notes:** When authentication factors change (MFA enable, MFA disable, password change), all other sessions for that user must be invalidated. Only the session initiating the change should survive. Currently, no session invalidation occurs on factor changes.

**7.4.2 Notes:** The `getActiveSessions` and `terminateSession` functions exist in the codebase as stubs (`throw new Error("Not implemented")`). They must be implemented to allow administrators to view all sessions for a user and terminate individual sessions. Required for Phase 2 admin MFA mandate.

## Session Timeout

| Requirement | ASVS Ref | Status |
|---|---|---|
| Idle timeout of 30 minutes | 7.3.1 | DEFERRED |

**7.3.1 Notes:** Not in scope for this sprint. Will be addressed in the next security upgrade cycle.
