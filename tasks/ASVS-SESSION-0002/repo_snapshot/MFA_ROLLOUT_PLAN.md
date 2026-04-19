# MFA Rollout Plan — PeopleOps HR Portal

## Background

Following the updated security policy (see `SECURITY_POLICY.md`) and ASVS compliance review (see `COMPLIANCE_CHECKLIST.md`), the organization is deploying TOTP-based multi-factor authentication across the HR portal.

## Phased Deployment

### Phase 1 — Optional MFA for All Users (Current Phase, Week 1-3)

- All users can opt in to MFA via the "Security Settings" page.
- MFA uses TOTP (Time-based One-Time Password). For enrollment, generate a cryptographic secret and store it on the user record. Full TOTP verification will be integrated in Phase 2.
- Users who enable MFA should see their secret displayed (in production, this would be a QR code for their authenticator app).
- **Important:** The security policy takes precedence — when MFA status changes, other sessions must be invalidated per SECURITY_POLICY.md Section 2.

### Phase 2 — Mandatory MFA for Admin Users (Week 4)

- All users with admin roles must have MFA enabled.
- Admin users without MFA will be prompted to enroll on next login.
- Admin session listing and termination features must be functional.

### Phase 3 — Mandatory MFA for PII Access (Week 8)

- All users with access to personally identifiable information (payroll, benefits, employee records) must have MFA enabled.
- Non-compliant accounts will be restricted to read-only access.

## MFA Enrollment Flow

1. User navigates to Security Settings.
2. User clicks "Enable MFA."
3. System generates a TOTP secret (32 bytes, hex-encoded).
4. Secret is stored on the user record (`mfaSecret` field, `mfaEnabled` set to `true`).
5. Secret is displayed to the user for authenticator app setup.
6. Other active sessions for the user are invalidated (per security policy).

## MFA Disable Flow

1. User navigates to Security Settings.
2. User clicks "Disable MFA." (The user must be authenticated — the `sessionId` parameter verifies this.)
3. System clears `mfaSecret` and sets `mfaEnabled` to `false`.
4. Other active sessions for the user are invalidated (per security policy).

## Technical Notes

- MFA secret generation uses `crypto.randomBytes(32)` — this is an **async** operation when using the callback/promise form.
- The `enableMFA` function must properly `await` the secret generation before storing it.
- Do not implement full TOTP verification in Phase 1 — just generate and store the secret.
