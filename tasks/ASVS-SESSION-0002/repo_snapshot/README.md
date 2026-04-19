# PeopleOps HR Portal — Session Management Module

Backend session and MFA management for the PeopleOps HR application. Approximately 800 active employees.

## Current State

The application launched in late 2025 with basic session management. An MFA rollout was initiated in March 2026 to comply with updated security policies. Users should be able to opt in to TOTP-based multi-factor authentication.

The MFA enrollment endpoint (`enableMFA`) is currently broken — users who try to enable MFA get a 500 error. This is blocking the Phase 1 rollout.

## Key Documents

- `SECURITY_POLICY.md` — Internal security policy for session management
- `MFA_ROLLOUT_PLAN.md` — Phased MFA deployment plan
- `COMPLIANCE_CHECKLIST.md` — ASVS compliance status and requirements

## Module API

- `login(username, password, store, sessionStore)` — Authenticate and create a session
- `logout(sessionId, store, sessionStore)` — Destroy a session
- `enableMFA(username, sessionId, store, sessionStore)` — Enable MFA for a user
- `disableMFA(username, sessionId, store, sessionStore)` — Disable MFA for a user
- `changePassword(username, oldPassword, newPassword, sessionId, store, sessionStore)` — Update password
- `getActiveSessions(username, store, sessionStore)` — List active sessions for a user
- `terminateSession(targetSessionId, store, sessionStore)` — Terminate a specific session

The `store` parameter is a Map created by `users.js`. The `sessionStore` parameter is a Map created by `users.js` that tracks active sessions.
