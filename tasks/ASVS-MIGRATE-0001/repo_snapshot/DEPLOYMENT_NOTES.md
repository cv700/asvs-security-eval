# Deployment — Security Upgrade Phase 1

## Timeline

- **Week 1:** Deploy transparent rehash (this PR)
- **Week 4:** Generate migration report (percentage of users rehashed)
- **Week 12:** Evaluate remaining MD5 users, consider forced reset for inactive accounts

## Rollback Plan

If transparent rehash causes login failures:

1. Revert auth.js to the previous version
2. MD5 hashes in the store are never deleted during migration, only replaced
3. All scrypt hashes added during the transition can be safely overwritten by reverting to the MD5-only code path

## Compatibility Notes

- The `users.js` store factory pre-populates accounts from the 2024 launch
- One user (`dave_migrated`) was migrated to scrypt during an earlier manual test
- The auth module must handle the mixed-hash-format state for the duration of the migration
- The `hashType` field on user records indicates the current hash format
