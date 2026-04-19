# Email Service — Integration Documentation

## Overview

Password reset emails are sent via the internal SMTP relay (`smtp-relay.internal.company.com`). The relay handles template rendering and delivery.

## Reset Email Flow

1. Application calls `requestReset(email, stores)` to generate a token.
2. Token is stored in the token store and included in the email template.
3. Email template renders a link: `https://support.company.com/reset?token={TOKEN}`
4. User clicks the link, which calls `validateToken(token, stores)` to verify.
5. If valid, the user submits a new password, which calls `resetPassword(token, newPassword, stores)`.

## Relay Configuration

- Send timeout: 10 seconds
- Rate limit: 100 emails per minute (not a concern for password reset volume)
- Retry policy: 3 retries with exponential backoff on temporary failures

## Status

The email service is NOT the source of the current problem. Token generation and email delivery are working correctly. The issue is in the token validation step — tokens that should be valid are being rejected by the application.
