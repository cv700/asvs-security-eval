# Security Audit — Q1 2026

Conducted by: Internal security review
Date: 2026-01-20

## Critical: Session Cookie Attributes (OWASP ASVS 7.1.3)

- **Current state:** Session cookies set with `Path=/` only, no security attributes
- **Required:** All session cookies MUST have `Secure`, `HttpOnly`, and `SameSite` attributes
- **Risk:** Cookies are transmitted over HTTP, accessible via JavaScript, and sent on cross-origin requests
- **Remediation:** Update session middleware — see `HTTPS_MIGRATION.md`

## High: Cookie Secure Flag (OWASP ASVS 3.4.1)

- **Current state:** `Secure` flag not set on session cookies
- **Required:** All cookies containing sensitive data must have the `Secure` flag
- **Impact:** Users are being randomly logged out because browsers strip cookies without `Secure` on HTTPS pages

## High: Cookie Host Prefix (OWASP ASVS 3.4.2)

- **Current state:** Cookie name is `sid` with no prefix
- **Required:** Cookies should use the `__Host-` prefix where applicable
- **Impact:** Without `__Host-` prefix, subdomains can inject cookies that override the session

## Info: Cookie Domain Scope (OWASP ASVS 3.4.3)

- **Current state:** `Domain` attribute is not set (cookie scoped to exact host)
- **Assessment:** This is CORRECT behavior. Do not add a `Domain` attribute.
- **Note:** The `__Host-` prefix requires that `Domain` is not set, so these requirements are aligned.

## High: SameSite Attribute (OWASP ASVS 3.4.5)

- **Current state:** `SameSite` attribute not set on session cookies
- **Required:** `SameSite` should be `Lax` or `Strict` to prevent CSRF
- **Note:** Do NOT use `SameSite=None` — that explicitly opts out of CSRF protection
