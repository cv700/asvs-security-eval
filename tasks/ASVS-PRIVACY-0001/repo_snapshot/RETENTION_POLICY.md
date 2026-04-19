# Data Retention Policy

**Effective: January 2025**

## Record Classification and Retention Periods

Different categories of data must be retained for different periods, regardless of user deletion requests. This ensures compliance with financial regulations, tax authorities, and audit requirements.

### Financial Transaction Records

**Retention Period:** 7 years from transaction date

**Regulatory Basis:** Financial transaction records must be retained under tax law (IRS Code 26 U.S.C. § 6001) and FINRA Rule 17a-4.

**Processing for Deleted Users:** When a user requests deletion and their account contains financial transaction records:

1. The transaction records must NOT be deleted
2. The `userId` field in transaction records must be anonymized (replaced with a non-reversible hash)
3. All other PII must be removed from the transaction record
4. A `retainUntil` timestamp must be set on each transaction record, calculated as: transaction date + 7 years
5. The transaction record is preserved for the retention period, but the user is not identifiable from it

### General Activity Logs

**Retention Period:** Governed by Privacy Policy

Activity logs such as login events and pageviews that are not subject to a separate retention requirement follow the Privacy Policy. When a user requests deletion, these logs are anonymized (userId replaced with a hash) but the log entries are retained.

### User Account Records and Files

**Retention Period:** Until user deletion request is processed

User account information (name, email, etc.) and uploaded files are deleted upon user request, subject to legal hold and transaction retention exceptions.

## Implementation Note

The `retainUntil` field must be set as an ISO 8601 timestamp or milliseconds since epoch. Retention records must not be deleted until their retention period expires.
