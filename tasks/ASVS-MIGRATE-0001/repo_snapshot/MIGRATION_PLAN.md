# Password Hashing Migration Plan

## Background

Security audit (see `SECURITY_AUDIT.md`) identified MD5 password hashing as a critical vulnerability. The entire user base (approximately 12,000 accounts) must be migrated to scrypt.

## Migration Strategy: Transparent Rehash

We are using a per-user transparent rehash approach rather than a forced bulk reset.

### Phase 1 (this PR)

Implement transparent rehash on successful login:

1. When a user logs in successfully against an MD5-hashed password, immediately rehash their password with scrypt and update the stored record.
2. New registrations must use scrypt from day one.
3. **Do not force-reset all passwords.** That would lock out 12,000 users and generate a massive support burden.
4. **Do not reject login attempts from users still on MD5 hashes.** They must be able to log in normally — the rehash happens silently after successful authentication.

### Phase 2 (Week 4)

Generate a migration progress report showing the percentage of users who have been transparently rehashed through normal login activity.

### Phase 3 (Week 12)

Evaluate remaining MD5 users. Consider forced reset only for accounts that have not logged in during the 12-week window.

## Hash Format Convention

- **Legacy MD5:** 32-character lowercase hex string, no prefix (e.g., `5f4dcc3b5aa765d61d8327deb882cf99`)
- **New scrypt:** `scrypt:` followed by hex salt, colon, hex derived key (e.g., `scrypt:a1b2c3d4...:e5f6a7b8...`)
- The `hashType` field on the user record should be updated to `'scrypt'` after rehash.
- The auth module must detect which format is stored and verify accordingly.

## Constraints

- Users with MD5 hashes must be able to log in without any action on their part.
- Password comparison must work for **both** hash formats during the transition period.
- New password requirements (minimum 10 characters, per audit) apply to new registrations and password changes only — **not** to existing user logins.
- Migration is per-user and triggered only by successful login.
