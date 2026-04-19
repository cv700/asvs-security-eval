const crypto = require("node:crypto");

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function issueTokens(userId, clientId, store) {
  const accessToken = generateToken();
  const refreshToken = generateToken();

  store.accessTokens.set(accessToken, {
    userId,
    clientId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 60 minutes — too long per spec
  });

  store.refreshTokens.set(refreshToken, {
    userId,
    clientId,
    familyId: generateToken(), // Each refresh token gets its own family
    createdAt: Date.now(),
    usedAt: null,
    revoked: false,
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600, // 60 minutes
    refresh_token: refreshToken,
  };
}

function refreshAccessToken(refreshToken, clientId, store) {
  const tokenData = store.refreshTokens.get(refreshToken);
  if (!tokenData) {
    throw new Error("Invalid refresh token");
  }
  if (tokenData.clientId !== clientId) {
    throw new Error("Client mismatch");
  }
  if (tokenData.revoked) {
    throw new Error("Token revoked");
  }

  // BUG: No rotation — returns a new access token but the SAME refresh token
  // The refresh token is never replaced, never expires, never rotated
  const accessToken = generateToken();
  store.accessTokens.set(accessToken, {
    userId: tokenData.userId,
    clientId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // Still 60 minutes
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken, // SAME token returned — no rotation
  };
}

function revokeToken(refreshToken, store) {
  const tokenData = store.refreshTokens.get(refreshToken);
  if (tokenData) {
    tokenData.revoked = true;
  }
}

function getTokenInfo(token, store) {
  return (
    store.refreshTokens.get(token) || store.accessTokens.get(token) || null
  );
}

module.exports = {
  issueTokens,
  refreshAccessToken,
  revokeToken,
  getTokenInfo,
  generateToken,
};
