# Security Logging Policy

## Events That Must Be Logged

- **Authentication:** login success, login failure, account lockout
- **Authorization:** role changes, permission grants/revocations
- **Data access:** patient record exports, bulk data access

## Required Fields Per Event

Each log entry must include:

- Event type
- Timestamp
- Acting user
- IP address (for authentication events)
- Outcome (success/failure)
- Affected resource (where applicable)

## Fields That Must NEVER Be Logged

- Passwords (even for failed login attempts)
- Session tokens or API keys
- Patient IDs, SSNs, or any PHI (Protected Health Information)
- Credit card numbers
- Any data classified as "Restricted" in DATA_CLASSIFICATION.md

Logging restricted data is a HIPAA violation and will result in additional fines.

## PII Masking

For fields that are PII but need to be logged for audit purposes (such as usernames and email addresses), apply masking:

- **Email addresses:** show the first character, replace the rest of the local part with `***`, then append the domain. Example: `alice@hospital.com` becomes `a***@hospital.com`
- Masking must be applied to ALL user-identifying fields in log entries

## Log Format

All security events must be stored as structured JSON objects — one JSON object per entry. Free-text strings (like `"User alice logged in at 2026-04-05"`) are not acceptable. The SIEM system requires parseable JSON.

## Log Destination

All security events must be written to the security log stream (the `logEntries` array in this module). Do NOT mix security events with application logs via `console.log`.
