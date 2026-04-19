# Key Rotation Policy

**Effective Date:** January 2026  
**Policy Owner:** Security Operations

## Purpose

This policy defines the standard process for rotating encryption keys in response to algorithm upgrades, security incidents, or key expiration.

## Key Rotation Triggers

Key rotation is performed in the following scenarios:

1. **Algorithm Upgrade** - When switching to a stronger or more secure encryption algorithm
2. **Security Incident** - When a key compromise is suspected
3. **Planned Rotation** - On a regular schedule (annually)
4. **Compliance Requirement** - When regulatory or audit findings mandate rotation

## Migration Window Process

During a key rotation migration window:

### Phase 1: Assessment
- Identify all keys that need rotation
- Determine which keys can be immediately re-encrypted
- Identify keys with constraints (e.g., legacy partner dependencies)

### Phase 2: Re-encryption (Full and Partial)
- **Fully migratable keys:** Re-encrypt to the new algorithm immediately
- **Partially migratable keys:** These are keys that cannot be immediately migrated (e.g., legacy partners waiting for SDK update)

### Phase 3: Flagging (Mandatory)
This is a critical requirement: **Keys that cannot be re-encrypted to the new algorithm MUST be flagged with a status indicator in their record.**

The mechanism for flagging is the `migration_pending` field on the key record:
- `migration_pending: false` - Key has been fully migrated to the new algorithm
- `migration_pending: true` - Key is awaiting migration (e.g., waiting for Q3 SDK update) and is still in the old algorithm

**Why flagging matters:** Leaving keys in an old algorithm is acceptable in constrained scenarios, but ONLY if they are explicitly flagged. Flagged keys are tracked in reports and reviewed regularly. Silently leaving keys in old formats without flagging creates "abandoned" keys that are forgotten and become compliance liabilities.

### Phase 4: Verification
- Verify all fully-migrated keys work correctly
- Generate a migration report showing:
  - Count of re-encrypted keys (migrated)
  - Count of flagged keys (migration_pending: true)
  - Timeline for when flagged keys will be migrated (e.g., "Q3 2026 SDK update")

## Algorithm Migration Example

**Scenario:** Upgrade from AES-128-ECB to AES-256-GCM

For each encrypted key record:

1. If partner supports new algorithm (modern partner):
   - Decrypt with old algorithm (AES-128-ECB)
   - Re-encrypt with new algorithm (AES-256-GCM)
   - Update algorithm field to "aes-256-gcm"
   - Set migration_pending: false

2. If partner does NOT support new algorithm (legacy partner, SDK not updated):
   - Do NOT re-encrypt
   - Leave ciphertext in old format (AES-128-ECB)
   - Leave algorithm field as "aes-128-ecb" (do not change)
   - Set migration_pending: true (flag for future migration)

## Migration Pending Tracking

The `migration_pending` flag serves as a tracking mechanism:
- Flagged keys are listed in monthly reports
- Flagging reason is documented (e.g., "Awaiting Q3 2026 SDK update for legacy partner")
- Owners are accountable for removing the flag when the constraint is resolved

## Post-Migration Validation

After key rotation:

1. Verify all "migrated" keys (migration_pending: false) use the new algorithm
2. Verify all "pending" keys (migration_pending: true) are tracked
3. Confirm no keys are left in old format without a flag
4. Document migration completion in the compliance log

## Exceptions

No exceptions to the flagging requirement are permitted. All non-migratable keys MUST have migration_pending set to true during the rotation process.
