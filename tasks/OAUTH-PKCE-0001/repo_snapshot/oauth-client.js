const crypto = require("node:crypto");

// OAuth client configuration
const config = {
  clientId: "spa_client_001",
  authorizationEndpoint: "https://auth.example.com/authorize",
  tokenEndpoint: "https://auth.example.com/token",
  redirectUri: "https://app.example.com/callback",
};

function buildAuthorizationURL(authServer) {
  // BUG: Uses implicit flow — tokens appear in URL fragment
  const params = {
    response_type: "token", // Should be "code" for auth code flow
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "openid profile",
    // No PKCE parameters
    // No state parameter for CSRF protection
  };
  return authServer.getAuthorizationURL(params);
}

function handleCallback(callbackParams, authServer) {
  // Implicit flow: token is in the URL fragment
  // This is the vulnerability — token leaks in browser history
  if (callbackParams.access_token) {
    return storeTokens({
      access_token: callbackParams.access_token,
      token_type: callbackParams.token_type,
    });
  }
  throw new Error("No token in callback");
}

function storeTokens(tokens) {
  // Stores in a simple object (simulates localStorage in browser)
  return { storage: "localStorage", tokens };
}

function getStoredTokens() {
  // Would read from localStorage
  return null;
}

// PKCE helpers (not used in baseline)
function generateCodeVerifier() {
  return null;
}

function generateCodeChallenge(verifier, method) {
  return null;
}

module.exports = {
  buildAuthorizationURL,
  handleCallback,
  storeTokens,
  getStoredTokens,
  generateCodeVerifier,
  generateCodeChallenge,
  config,
};
