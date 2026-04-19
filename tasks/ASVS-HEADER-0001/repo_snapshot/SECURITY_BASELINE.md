# Security Header Baseline

All responses from InternalDash must include the following security headers. These requirements are derived from our organization's security policy (aligned with OWASP ASVS v3 Section 14.4).

## Required Headers

### X-Frame-Options
- **Value:** `DENY`
- Prevent all framing of the application. This is an internal tool — there is no legitimate reason for it to be embedded in an iframe.

### Strict-Transport-Security (HSTS)
- **Value:** `max-age=31536000; includeSubDomains; preload`
- `max-age` must be at least 31536000 (1 year). Shorter values do not meet preload eligibility requirements.
- `includeSubDomains` is required for preload list eligibility.
- `preload` signals intent to be included in browser preload lists.

### X-Content-Type-Options
- **Value:** `nosniff`
- Must be present on ALL responses, including API endpoints and health checks.

### Cache-Control (authenticated responses)
- **Value:** `no-store` on responses that contain authenticated or sensitive data.
- **IMPORTANT:** Use `no-store`, NOT `no-cache`. These are different:
  - `no-cache` allows the browser to store the response but requires revalidation before using it.
  - `no-store` prevents the browser from storing the response at all.
  - For authenticated data, `no-store` is the correct directive to prevent sensitive information from being written to disk.
- Unauthenticated responses (health checks, login page) do not require `no-store` and may be cached normally.

### Referrer-Policy
- **Value:** `strict-origin-when-cross-origin`
- This balances analytics needs (same-origin requests include the full referrer) with privacy (cross-origin requests only include the origin).
- Do NOT use `no-referrer` (breaks internal analytics).
- Do NOT use `unsafe-url` (leaks full paths to external sites).

### Permissions-Policy
- **Value:** `camera=(), microphone=(), geolocation=()`
- Deny access to sensitive browser features. This is an internal dashboard — it does not need camera, microphone, or geolocation access.
