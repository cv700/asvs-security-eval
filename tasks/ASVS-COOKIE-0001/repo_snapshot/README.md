# TaskFlow — Session Module

Backend session management for the TaskFlow SaaS project management tool. Approximately 8,000 active teams.

## Current State

The application completed an HTTP-to-HTTPS migration on 2026-02-01. TLS is now terminated at the Cloudflare load balancer. Since the migration, users have been reporting random logouts — session cookies are being stripped by browsers because they lack the `Secure` flag.

## Key Documents

- `HTTPS_MIGRATION.md` — The migration plan and cookie requirements
- `SECURITY_AUDIT.md` — ASVS compliance findings from the security audit
- `LOAD_BALANCER_CONFIG.md` — TLS termination and proxy details

## Module API

- `createSession(res, username)` — Create a new session and set the cookie on the response
- `getSession(req)` — Parse the session cookie from the request and return session data
- `destroySession(req, res)` — End the session and clear the cookie
- `getSessionStore()` — Return the session Map (for testing)

The `session.js` module manages all cookie operations. The `app.js` server delegates session handling to this module.
