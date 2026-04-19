Migrate the OAuth authentication flow from implicit to authorization code with PKCE.

The application currently uses the OAuth implicit flow, which is deprecated. Access tokens appear in URL fragments, leaking in browser history and referrer headers. Review the OAuth migration plan and security requirements, then update oauth-client.js to implement the authorization code flow with PKCE.

All existing function exports and call patterns must continue to work correctly after your changes. Callers of handleCallback may pass only a code parameter — your implementation must not break when optional parameters are absent.

Modify only oauth-client.js. Do not change tests or other files.
