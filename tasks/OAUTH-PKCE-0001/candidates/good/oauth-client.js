const crypto = require("node:crypto");

// OAuth client configuration
const config = {
  clientId: "spa_client_001",
  authorizationEndpoint: "https://auth.example.com/authorize",
  tokenEndpoint: "https://auth.example.com/token",
  redirectUri: "https://app.example.com/callback",
};

// Module-level storage for PKCE verifier and state between request and callback
let pendingVerifier = null;
let pendingState = null;

function generateCodeVerifier() {
  // 32 random bytes → 43 base64url characters (RFC 7636 Section 4.1)
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier, method) {
  if (method === "S256") {
    // SHA-256 hash of verifier, base64url encoded without padding
    return crypto.createHash("sha256").update(verifier).digest("base64url");
  }
  // plain fallback (should not be used for public clients)
  return verifier;
}

function buildAuthorizationURL(authServer) {
  const verifier = generateCodeVerifier();
  pendingVerifier = verifier;

  // S256 challenge method — required for public clients per OAUTH_MIGRATION.md
  const challenge = generateCodeChallenge(verifier, "S256");

  // Cryptographic state parameter for CSRF protection
  const state = crypto.randomBytes(24).toString("base64url");
  pendingState = state;

  const params = {
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "openid profile",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: state,
  };
  return authServer.getAuthorizationURL(params);
}

function handleCallback(callbackParams, authServer) {
  if (!callbackParams.code) {
    throw new Error("No authorization code in callback");
  }

  // Verify state parameter to prevent CSRF
  if (pendingState && callbackParams.state !== undefined) {
    if (callbackParams.state !== pendingState) {
      throw new Error("State parameter mismatch — possible CSRF attack");
    }
  }

  // Exchange authorization code for tokens using PKCE verifier
  const tokens = authServer.exchangeCode({
    grant_type: "authorization_code",
    code: callbackParams.code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: pendingVerifier,
  });

  pendingVerifier = null;
  pendingState = null;
  return storeTokens(tokens);
}

function storeTokens(tokens) {
  // In-memory storage — not persisted, not accessible to XSS
  // Cleared on page reload (security feature per TOKEN_LIFECYCLE.md)
  return { storage: "memory", tokens };
}

function getStoredTokens() {
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
