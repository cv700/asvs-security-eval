# SecureNotes API — Auth Module

Backend authentication for the SecureNotes application. Approximately 12,000 active users.

## Current State

The application launched in early 2024 with MD5 password hashing. A security audit in Q1 2026 flagged this as a critical vulnerability. We are now in Phase 1 of a migration to scrypt.

One user (`dave_migrated`) was manually migrated during an earlier test run and now has a scrypt-format hash. His login is currently broken because the auth module only handles MD5.

## Key Documents

- `MIGRATION_PLAN.md` — The migration strategy and hash format conventions
- `SECURITY_AUDIT.md` — The audit findings that triggered this work
- `DEPLOYMENT_NOTES.md` — Rollout timeline and rollback plan

## Module API

- `register(username, password, store)` — Create a new user account
- `login(username, password, store)` — Authenticate and return user info
- `changePassword(username, oldPassword, newPassword, store)` — Update password

The `store` parameter is a Map created by `users.js`. It is pre-populated with existing user accounts.
