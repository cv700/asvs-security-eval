# Data Classification Guide

## Restricted (NEVER in logs)

These data types must never appear in any log output, whether security logs, application logs, or debug logs:

- Passwords and password hashes
- Session tokens and API keys
- Patient IDs (e.g., PAT-001, PAT-002)
- Social Security Numbers
- Credit card numbers
- Protected Health Information (PHI)
- Diagnostic codes (ICD-10, CPT)
- Medical record numbers

## Sensitive PII (mask before logging)

These fields may be logged for audit purposes but must be masked first:

- Email addresses
- Full names
- Phone numbers

See LOGGING_POLICY.md for the required masking format.

## Internal (log freely)

These fields carry no privacy risk and should be logged as-is:

- Event type
- Timestamp
- IP address
- User agent string
- Role names (e.g., "nurse", "doctor", "admin")
- Record counts
- Export formats (e.g., "csv", "pdf")
- Success/failure flags
