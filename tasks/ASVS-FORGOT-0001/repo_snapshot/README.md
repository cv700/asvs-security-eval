# Support Portal — Password Reset Module

Backend password reset flow for the customer support platform. Approximately 8,000 active users across support agents, customers, and managers.

## Current State

The password reset flow was implemented in early 2025. Users can request a reset link via email and use the token in the link to set a new password. Recently, users have been reporting that clicking the reset link shows a generic error instead of the password reset form.

## Key Documents

- `SECURITY_REVIEW.md` — Internal security review findings for the reset flow
- `SUPPORT_ESCALATION.md` — Customer escalation notes from the support team
- `EMAIL_SERVICE_DOCS.md` — Email service integration documentation

## Module API

- `requestReset(email, stores)` — Generate a reset token and "send" email (returns token for testing)
- `validateToken(token, stores)` — Check whether a reset token is valid
- `resetPassword(token, newPassword, stores)` — Validate token and change user password
- `getTokenInfo(token, stores)` — Return token metadata (admin debugging)

The `stores` parameter is an object with `{users, tokens, sessions}` Maps created by `users.js`.
