# Legal Hold Procedure

**Compliance Document | Confidential**

## Overview

This procedure governs the handling of user accounts subject to legal hold. A legal hold is placed on a user account when the account or its data is subject to litigation, regulatory investigation, or other legal proceedings that require preservation of records.

## Legal Hold Status

When an account is placed under legal hold, a `legalHold: true` flag is set on the user record in our system. This flag must be checked before processing any deletion request.

## Processing Deletion Requests for Accounts Under Legal Hold

**When a deletion request is submitted for an account with `legalHold: true`:**

1. The deletion request must NOT be processed immediately
2. The request status must be set to `'held'` in the deletion requests table
3. No data may be deleted, modified, or anonymized
4. The request must be retained in a queue for later processing

**Rationale:** Deleting or modifying data for accounts under legal hold violates litigation hold requirements and could constitute evidence tampering. All data must be preserved until the hold is explicitly lifted.

## Legal Hold Removal

A legal hold may only be removed by the Legal Department after the underlying legal matter is resolved. Once the hold is removed, queued deletion requests may be processed according to the standard deletion procedure.

## Compliance Violation

Attempting to delete, modify, or process data deletion for an account under legal hold is a critical compliance violation and must be prevented by our system.
