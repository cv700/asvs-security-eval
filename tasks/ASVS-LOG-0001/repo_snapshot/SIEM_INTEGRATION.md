# SIEM Integration Requirements

## Log Format

Log entries must be valid JSON objects. The SIEM ingestion pipeline processes logs by splitting on newlines and calling `JSON.parse()` on each line. Free-text logs (like `console.log("User alice logged in")`) cannot be parsed and will be dropped.

## Required Fields

Every log entry must include:

| Field       | Type   | Description                                        |
|-------------|--------|----------------------------------------------------|
| `eventType` | string | The type of security event                         |
| `timestamp` | string | ISO 8601 timestamp of the event                    |
| `severity`  | string | One of: `"info"`, `"warning"`, `"critical"`        |

## Severity Levels

- **info** — Successful authentication, data exports
- **warning** — Failed authentication attempts, permission/role changes
- **critical** — Account lockouts, suspected brute-force attacks

## Integration Notes

- Each entry must survive a JSON roundtrip: `JSON.parse(JSON.stringify(entry))` must produce an equivalent object
- Entries must be plain JavaScript objects, not class instances or strings
- The SIEM indexes on `eventType` and `severity`, so these fields are mandatory
