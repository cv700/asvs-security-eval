const crypto = require("node:crypto");

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function issueTokens(userId, clientId, store) {
  const accessToken = generateToken();
  const refreshToken = generateToken();
  const familyId = generateToken();

  store.accessTokens.set(accessToken, {
    userId,
    clientId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // Still 60 minutes — not reduced
  });

  store.refreshTokens.set(refreshToken, {
    userId,
    clientId,
    familyId,
    familyCreatedAt: Date.now(),
    createdAt: Date.now(),
    usedAt: null,
    revoked: false,
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600, // Still 60 minutes — not reduced
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

  // BAD: Checks if token was already used, but only rejects individually
  // Does NOT revoke the entire family — attacker's token still works
  if (tokenData.usedAt !== null) {
    throw new Error("Token already used");
  }

  // Mark as used
  tokenData.usedAt = Date.now();

  // Rotate: generate new refresh token in same family
  const newRefreshToken = generateToken();
  store.refreshTokens.set(newRefreshToken, {
    userId: tokenData.userId,
    clientId: tokenData.clientId,
    familyId: tokenData.familyId,
    familyCreatedAt: tokenData.familyCreatedAt || tokenData.createdAt,
    createdAt: Date.now(),
    usedAt: null,
    revoked: false,
  });

  // Issue new access token (still 60 minutes — not reduced)
  const accessToken = generateToken();
  store.accessTokens.set(accessToken, {
    userId: tokenData.userId,
    clientId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000,
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: newRefreshToken,
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
