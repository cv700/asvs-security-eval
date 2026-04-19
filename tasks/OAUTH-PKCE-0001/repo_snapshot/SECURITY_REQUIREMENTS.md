# Security Requirements — Token Storage

## Token Storage Policy

Access tokens MUST NOT be stored in `localStorage`. The `localStorage` API is accessible to any JavaScript running on the same origin, including scripts injected via XSS vulnerabilities. A single XSS payload can exfiltrate all tokens from `localStorage`.

### Approved Storage Mechanisms

| Mechanism | Lifetime | XSS Risk | Recommended For |
|-----------|----------|----------|-----------------|
| In-memory (JS variable) | Page reload | Low — not persisted | Access tokens |
| `sessionStorage` | Tab close | Medium — same-tab XSS | Short-lived tokens |
| `localStorage` | **Forever** | **HIGH — any XSS** | **NEVER for tokens** |

The `storeTokens` function must return an object indicating the storage mechanism used. The `storage` field must be `"memory"` or `"sessionStorage"`, never `"localStorage"`.

## Access Token Lifetime

- Access tokens: 5 minutes (300 seconds), short-lived
- Refresh tokens: stored securely, used to obtain new access tokens

## General Token Security

- Tokens must not appear in URLs (query strings or fragments)
- Tokens must not be logged
- Tokens must be transmitted only over HTTPS
