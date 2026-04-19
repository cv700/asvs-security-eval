function validateScopes(requestedScopes, clientId, store) {
  // BUG: Only accepts new scope format — rejects old scopes with 400
  const client = store.clients.get(clientId);
  if (!client) throw new Error("Unknown client");

  for (const scope of requestedScopes) {
    if (!store.validNewScopes.has(scope)) {
      throw new Error(`Invalid scope: ${scope}`);  // This rejects "read", "write", "admin"
    }
  }

  return requestedScopes;
}

function issueToken(requestedScopes, clientId, store) {
  const validatedScopes = validateScopes(requestedScopes, clientId, store);
  return {
    access_token: `at_${Date.now()}`,
    token_type: "Bearer",
    scope: validatedScopes.join(" "),
    expires_in: 300,
  };
}

function refreshWithScopes(refreshToken, store) {
  const tokenData = store.refreshTokens.get(refreshToken);
  if (!tokenData) throw new Error("Invalid refresh token");

  // Issues new token with whatever scopes are on the refresh token
  return issueToken(tokenData.scopes, tokenData.clientId, store);
}

function getGrantedScopes(clientId, store) {
  const client = store.clients.get(clientId);
  if (!client) throw new Error("Unknown client");
  return client.grantedNewScopes;
}

module.exports = { validateScopes, issueToken, refreshWithScopes, getGrantedScopes };
