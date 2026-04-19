function createTokenStore() {
  return {
    // refreshTokens: Map of tokenId -> {userId, clientId, familyId, familyCreatedAt, createdAt, usedAt, revoked}
    refreshTokens: new Map(),
    // accessTokens: Map of tokenId -> {userId, clientId, expiresAt, createdAt}
    accessTokens: new Map(),
    // revokedFamilies: Set of familyId — when a family is revoked, ALL tokens in the family are invalid
    revokedFamilies: new Set(),
    // auditLog: array of {event, timestamp, tokenId, userId, reason}
    auditLog: [],
  };
}

module.exports = { createTokenStore };
