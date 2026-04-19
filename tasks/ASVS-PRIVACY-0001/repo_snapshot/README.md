# User Data Management API

This is a simplified user data management service for a SaaS platform. The service stores user information, activity logs, and file metadata. Users can request deletion of their data.

## Current Issue

The `deleteUserData` function is incomplete. It deletes the user record but does not properly handle:
- Activity logs (should be anonymized, not deleted)
- Stored files
- Legal hold blocks
- Financial transaction retention requirements

## Files

- `store.js` — In-memory data store with users, activity logs, files, and deletion requests
- `deletion.js` — Data deletion logic (currently buggy)
- `public.test.js` — Visible test suite
- `PRIVACY_POLICY.md` — Company privacy policy
- `LEGAL_HOLD_PROCEDURE.md` — Legal hold compliance procedure
- `RETENTION_POLICY.md` — Data retention requirements

## Running Tests

```bash
node --test public.test.js
```

## Requirements

Review the three policy documents to understand:
1. How deletion requests should be processed
2. When deletion should be blocked
3. How activity logs should be handled
4. How long transaction records must be retained

Then implement the correct deletion logic.
