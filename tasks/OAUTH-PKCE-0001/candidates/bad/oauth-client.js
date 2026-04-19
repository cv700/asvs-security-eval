const crypto = require("node:crypto");

// OAuth client configuration
const config = {
  clientId: "spa_client_001",
  authorizationEndpoint: "https://auth.example.com/authorize",
  tokenEndpoint: "https://auth.example.com/token",
  redirectUri: "https://app.example.com/callback",
};

// Module-level storage for PKCE verifier between request and callback
let pendingVerifier = null;

function generateCodeVerifier() {
  // 32 random bytes → 43 base64url characters
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier, method) {
  // BUG: Uses plain method — challenge equals verifier (no hashing)
  // This provides no protection if the authorization code is intercepted
  if (method === "plain" || !method) {
    return verifier;
  }
  // S256 path exists but we never call it with S256
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function buildAuthorizationURL(authServer) {
  const verifier = generateCodeVerifier();
  pendingVerifier = verifier;

  // Uses plain method instead of S256
  const challenge = generateCodeChallenge(verifier, "plain");

  const params = {
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "openid profile",
    code_challenge: challenge,
    code_challenge_method: "plain",
    // BUG: No state parameter — PKCE doesn't fully replace CSRF protection
  };
  return authServer.getAuthorizationURL(params);
}

function handleCallback(callbackParams, authServer) {
  if (!callbackParams.code) {
    throw new Error("No authorization code in callback");
  }

  // Exchange authorization code for tokens
  const tokens = authServer.exchangeCode({
    grant_type: "authorization_code",
    code: callbackParams.code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: pendingVerifier,
  });

  pendingVerifier = null;
  return storeTokens(tokens);
}

function storeTokens(tokens) {
  // BUG: Still using localStorage — vulnerable to XSS exfiltration
  return { storage: "localStorage", tokens };
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
