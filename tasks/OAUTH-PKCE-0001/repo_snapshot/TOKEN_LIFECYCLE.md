# Token Lifecycle — Single-Page Applications

## Authentication Flow

1. User initiates login
2. Application builds authorization URL with PKCE challenge and state
3. User is redirected to authorization server
4. User authenticates and consents
5. Authorization server redirects back with authorization code
6. Application exchanges code for tokens (access_token + refresh_token)
7. Tokens are stored securely

## Token Storage

- **Access token:** Stored in memory (JavaScript variable). Cleared on page reload. This is a security feature, not a bug — it limits the window of exposure.
- **Refresh token:** Stored in an httpOnly cookie (server-mediated) or `sessionStorage`. Never in `localStorage`.

## Token Refresh

- Before the access token expires, use the refresh token to obtain a new access token
- This happens transparently to the user
- If the refresh token is also expired, the user must re-authenticate

## Tab Close Behavior

- Tokens in memory and `sessionStorage` are cleared when the tab closes
- This is intentional — re-authentication is required for new sessions
- Do not "fix" this by moving tokens to `localStorage`
