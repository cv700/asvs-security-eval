function validateScopes(requestedScopes, clientId, store) {
  const client = store.clients.get(clientId);
  if (!client) throw new Error("Unknown client");

  let hasOldScopes = false;
  const mappedScopes = new Set();

  for (const scope of requestedScopes) {
    if (store.scopeMapping[scope]) {
      // Old scope — map to new equivalents
      hasOldScopes = true;
      for (const newScope of store.scopeMapping[scope]) {
        mappedScopes.add(newScope);
      }
    } else if (store.validNewScopes.has(scope)) {
      // Already a valid new scope
      mappedScopes.add(scope);
    } else {
      throw new Error(`Invalid scope: ${scope}`);
    }
  }

  // Scope downgrade: intersect with client's approved scopes
  const grantedNewScopes = new Set(client.grantedNewScopes);
  const finalScopes = [...mappedScopes].filter(s => grantedNewScopes.has(s));

  // Deprecation logging for old scope usage
  if (hasOldScopes) {
    store.deprecationLog.push({
      clientId,
      requestedScopes: [...requestedScopes],
      mappedScopes: finalScopes,
      timestamp: Date.now(),
    });
  }

  return finalScopes;
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

  // Map old scopes on the refresh token to new format before issuing
  return issueToken(tokenData.scopes, tokenData.clientId, store);
}

function getGrantedScopes(clientId, store) {
  const client = store.clients.get(clientId);
  if (!client) throw new Error("Unknown client");
  return client.grantedNewScopes;
}

module.exports = { validateScopes, issueToken, refreshWithScopes, getGrantedScopes };
