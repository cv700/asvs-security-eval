# OAuth Migration Plan

## Background

The OAuth implicit flow (`response_type=token`) is deprecated per OAuth 2.1 (draft-ietf-oauth-v2-1) and RFC 9700. Tokens delivered via URL fragments leak through:

- Browser history
- Referrer headers
- Proxy server logs
- Browser extensions with history access

## Target: Authorization Code Flow with PKCE

Migrate all public clients (SPAs, mobile apps) to the authorization code flow with PKCE (Proof Key for Code Exchange, RFC 7636).

### PKCE Requirements

1. **Challenge method:** `code_challenge_method` MUST be `S256` (SHA-256). The `plain` method is NOT acceptable for public clients because it provides no protection if the authorization code is intercepted — an attacker who intercepts the code also has the plain challenge, which equals the verifier.

2. **Code verifier:** Generated with cryptographic randomness, 43-128 characters, using unreserved characters per RFC 7636 Section 4.1: `[A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"`

3. **Code challenge:** `BASE64URL(SHA256(code_verifier))` — the SHA-256 hash of the verifier, encoded as base64url without padding.

### State Parameter

The `state` parameter MUST still be sent with the authorization request. PKCE protects against authorization code interception but does NOT fully replace CSRF protection. The state parameter:

- Must be cryptographically random
- Must be verified in the callback response
- Prevents cross-site request forgery on the redirect URI

### Issuer Validation

Validate the `iss` claim in authorization responses when supported by the server, to prevent authorization server mix-up attacks (RFC 9207).

## Migration Steps

1. Change `response_type` from `token` to `code`
2. Generate PKCE code verifier and challenge
3. Include `code_challenge` and `code_challenge_method=S256` in authorization request
4. Include `state` parameter in authorization request
5. In callback: verify state, exchange authorization code for tokens using `code_verifier`
6. Store tokens securely (see SECURITY_REQUIREMENTS.md)
