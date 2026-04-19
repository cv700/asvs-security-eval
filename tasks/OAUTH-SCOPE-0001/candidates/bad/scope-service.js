function validateScopes(requestedScopes, clientId, store) {
  const client = store.clients.get(clientId);
  if (!client) throw new Error("Unknown client");

  // Accept old scopes by checking if they exist in the mapping
  for (const scope of requestedScopes) {
    if (!store.validNewScopes.has(scope) && !store.scopeMapping[scope]) {
      throw new Error(`Invalid scope: ${scope}`);
    }
  }

  // Return the original requested scopes (BUG: does not map to new format)
  return requestedScopes;
}

function issueToken(requestedScopes, clientId, store) {
  const validatedScopes = validateScopes(requestedScopes, clientId, store);
  // BUG: Token contains whatever scopes were requested, including old format strings
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

  // BUG: Does not migrate old scopes on the refresh token
  return issueToken(tokenData.scopes, tokenData.clientId, store);
}

function getGrantedScopes(clientId, store) {
  const client = store.clients.get(clientId);
  if (!client) throw new Error("Unknown client");
  return client.grantedNewScopes;
}

module.exports = { validateScopes, issueToken, refreshWithScopes, getGrantedScopes };
