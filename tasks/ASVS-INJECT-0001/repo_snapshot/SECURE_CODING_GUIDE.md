# Secure Coding Guide

This document defines the mandatory secure coding requirements for the CMS project. All contributors must follow these rules.

## Rule 1: Parameterized Queries

All database queries must use parameterized queries. No string concatenation of user input into query strings is permitted.

- Use `db.query(operation, params)` for all database operations.
- Never use `db.unsafeQuery()` — this function exists only for legacy compatibility and will be removed in a future release.
- Every query function in the codebase must be audited and converted if necessary.

## Rule 2: Output Encoding

All user-generated content rendered in an HTML context must be HTML-entity-encoded before output. This prevents cross-site scripting (XSS) attacks.

Minimum encoding requirements — the following characters must be encoded:
- `<` → `&lt;`
- `>` → `&gt;`
- `&` → `&amp;`
- `"` → `&quot;`
- `'` → `&#x27;`

The `renderPost` function is the encoding layer in the rendering pipeline. It must encode the `title` and `body` fields before returning them.

## Rule 3: ORDER BY Allowlist

ORDER BY clauses cannot be parameterized in most SQL databases because column names are identifiers, not values. User-supplied sort fields must be validated against an explicit allowlist of permitted column names.

Allowed sort columns: `id`, `title`, `author`, `category`, `status`

Any sort field not in the allowlist must be rejected and replaced with the default sort column (`id`).

## Rule 4: Error Messages

Database errors must not be exposed to the client. Return generic error messages (e.g., "An error occurred") instead of SQL error details or stack traces. Never include query text in error responses.
