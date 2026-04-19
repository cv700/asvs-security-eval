# Support Escalation — Password Reset Failures

Escalated by: Support Team Lead
Date: 2026-03-18
Priority: P1

## Summary

12 tickets opened in the last week reporting that password reset links "don't work." Users click the link in their email but see a generic error page ("An error occurred. Please try again.") instead of the password reset form.

## Affected Users

- Customer `bob@customer.org` attempted reset 4 times in the last 3 days. Each time he clicked the link within minutes of receiving the email. Same error every time.
- Support agent `alice@company.com` also reported the issue after a routine password rotation.
- Manager `carol@company.com` confirmed the same behavior.

## Investigation Notes

- The email service is confirmed working — emails are being sent and delivered. The SMTP relay logs show successful delivery for all reset requests.
- Reset links contain valid-looking tokens (e.g., `https://support.company.com/reset?token=reset-abc123-x7f2`).
- The reset page calls `validateToken` with the token from the URL. The endpoint returns a 400 error regardless of the token provided.
- One customer reported that an OLD reset link (from approximately 3 weeks ago) seemed to partially work before the recent code push — this suggests tokens were never expiring, and the current breakage is a new regression.

## Impact

- 12 affected users and counting
- Support team cannot manually reset passwords through the normal flow
- Workaround: Direct database password update (requires engineering intervention)
