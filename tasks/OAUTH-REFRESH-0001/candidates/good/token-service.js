const crypto = require("node:crypto");

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

const ABSOLUTE_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const ACCESS_TOKEN_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes
const ACCESS_TOKEN_LIFETIME_SEC = 300; // 5 minutes

function issueTokens(userId, clientId, store) {
  const accessToken = generateToken();
  const refreshToken = generateToken();
  const familyId = generateToken();
  const now = Date.now();

  store.accessTokens.set(accessToken, {
    userId,
    clientId,
    createdAt: now,
    expiresAt: now + ACCESS_TOKEN_LIFETIME_MS,
  });

  store.refreshTokens.set(refreshToken, {
    userId,
    clientId,
    familyId,
    familyCreatedAt: now,
    createdAt: now,
    usedAt: null,
    revoked: false,
  });

  store.auditLog.push({
    event: "issue",
    timestamp: now,
    tokenId: refreshToken,
    userId,
    reason: "initial_token_issue",
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_LIFETIME_SEC,
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

  // Family validation — check if entire family has been revoked
  if (store.revokedFamilies.has(tokenData.familyId)) {
    throw new Error("Token family revoked");
  }

  // Replay detection — if token was already used, revoke the entire family
  if (tokenData.usedAt !== null) {
    store.revokedFamilies.add(tokenData.familyId);
    store.auditLog.push({
      event: "replay_detected",
      timestamp: Date.now(),
      tokenId: refreshToken,
      userId: tokenData.userId,
      reason: "replay_detected",
    });
    throw new Error("Replay detected — token family revoked");
  }

  // Absolute lifetime check — 90 days from family creation
  const familyAge = Date.now() - (tokenData.familyCreatedAt || tokenData.createdAt);
  if (familyAge > ABSOLUTE_LIFETIME_MS) {
    throw new Error("Refresh token expired — absolute lifetime exceeded");
  }

  // Mark the current token as used
  tokenData.usedAt = Date.now();

  // Generate new refresh token in the same family
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

  // Issue new access token with 5-minute lifetime
  const accessToken = generateToken();
  const now = Date.now();
  store.accessTokens.set(accessToken, {
    userId: tokenData.userId,
    clientId,
    createdAt: now,
    expiresAt: now + ACCESS_TOKEN_LIFETIME_MS,
  });

  store.auditLog.push({
    event: "refresh",
    timestamp: now,
    tokenId: newRefreshToken,
    userId: tokenData.userId,
    reason: "token_rotated",
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_LIFETIME_SEC,
    refresh_token: newRefreshToken,
  };
}

function revokeToken(refreshToken, store) {
  const tokenData = store.refreshTokens.get(refreshToken);
  if (tokenData) {
    tokenData.revoked = true;
    store.auditLog.push({
      event: "revoke",
      timestamp: Date.now(),
      tokenId: refreshToken,
      userId: tokenData.userId,
      reason: "manual_revocation",
    });
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
