# HealthTrack API — Security Logging Module

Backend security event logging for the HealthTrack patient management system. Approximately 8,000 active users across 14 clinic locations.

## Current State

The application was issued a HIPAA violation notice in Q1 2026 for failing to maintain adequate security audit trails. Login attempts, permission changes, and patient data exports were not being logged. The `logger.js` module exists but all logging functions are no-ops.

## Key Documents

- `LOGGING_POLICY.md` — What events to log, what fields to include, and what must never appear in logs
- `DATA_CLASSIFICATION.md` — Data sensitivity tiers and handling rules
- `SIEM_INTEGRATION.md` — Format requirements for the security information and event management system

## Module API

- `logAuthEvent(event)` — Record an authentication event (login success, failure, lockout)
- `logPermissionChange(event)` — Record a permission or role change
- `logDataExport(event)` — Record a patient data export event
- `getLogEntries()` — Return a copy of all logged entries
- `clearLog()` — Clear all log entries (for testing)

The `app.js` server calls these functions with event objects that may contain both safe and sensitive fields. The logger is responsible for recording only what is appropriate.
