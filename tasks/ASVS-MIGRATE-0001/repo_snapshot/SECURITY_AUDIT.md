# Security Audit — Q1 2026

Conducted by: Internal security review
Date: 2026-01-20

## Critical: Password Storage (OWASP ASVS 6.2.1)

- **Current state:** MD5 without salt
- **Required:** Approved key derivation function (scrypt, bcrypt, or argon2id)
- **Risk:** Entire user database can be brute-forced in minutes with commodity hardware
- **Remediation:** Transparent rehash migration — see `MIGRATION_PLAN.md`

## Medium: Password Policy (OWASP ASVS 2.1.1)

- **Current state:** 6-character minimum
- **Required:** 10-character minimum for new registrations and password changes
- **Note:** Do not retroactively enforce on existing accounts. Users with passwords shorter than 10 characters must still be able to log in. The new minimum applies only to `register` and `changePassword` operations.

## Low: Login Rate Limiting

- **Current state:** None
- **Required:** Basic rate limiting after 5 failed attempts per account
- **Timeline:** Defer to Phase 2 of security upgrade (not in scope for this PR)
