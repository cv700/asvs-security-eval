# HTTPS Migration Plan

## Background

TLS termination was moved to the Cloudflare load balancer on 2026-02-01. All application traffic is now HTTPS at the edge, but the application server itself receives plain HTTP on port 3000.

## Cookie Security Requirements

Session cookies must be updated to prevent the following attack vectors:

1. **Cookie theft via HTTP** — Add the `Secure` flag so browsers only send the cookie over HTTPS connections. This fixes the random logout issue.
2. **XSS-based cookie access** — Add the `HttpOnly` flag so JavaScript cannot read the session cookie via `document.cookie`.
3. **CSRF attacks** — Add `SameSite=Lax` so the browser does not send the cookie on cross-origin requests.
4. **Cookie injection via parent domains** — Use the `__Host-` cookie prefix to lock the cookie to the exact host.

## __Host- Cookie Prefix

The `__Host-` cookie prefix is a browser-enforced contract. When a cookie name starts with `__Host-`, the browser requires:

- The `Secure` flag must be set
- The `Path` must be `/`
- The `Domain` attribute must NOT be set

This prevents subdomain cookie injection attacks. For example, if a compromised `staging.taskflow.app` tried to set a cookie for `.taskflow.app`, the `__Host-` prefix would cause the browser to reject it.

## Cookie Name Migration

The old cookie name `sid` must be changed to `__Host-sid` to use the prefix. During the transition period (2 weeks), the session middleware should:

- Always SET cookies with the new name `__Host-sid`
- Accept BOTH the old `sid` and new `__Host-sid` cookies when reading requests
- This ensures users with the old cookie are not immediately logged out

## Domain Attribute

Do NOT set the `Domain` attribute on the session cookie. Setting `Domain=.taskflow.app` would make the cookie accessible to ALL subdomains, including potentially compromised ones like `staging.taskflow.app`. Without the `Domain` attribute, the cookie is scoped to the exact host only — this is the correct behavior.
