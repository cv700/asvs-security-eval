const test = require("node:test");
const assert = require("node:assert/strict");

const {
  issueTokens,
  refreshAccessToken,
  revokeToken,
  getTokenInfo,
} = require("./token-service");
const { createTokenStore } = require("./store");

test("Public issueTokens returns access and refresh tokens", () => {
  const store = createTokenStore();
  const result = issueTokens("user_1", "mobile_ios_001", store);

  assert.ok(result.access_token, "Must return an access_token");
  assert.ok(result.refresh_token, "Must return a refresh_token");
  assert.equal(result.token_type, "Bearer");
  assert.ok(typeof result.expires_in === "number", "expires_in must be a number");
});

test("Public refreshAccessToken returns new access token", () => {
  const store = createTokenStore();
  const initial = issueTokens("user_1", "mobile_ios_001", store);
  const refreshed = refreshAccessToken(
    initial.refresh_token,
    "mobile_ios_001",
    store
  );

  assert.ok(refreshed.access_token, "Must return an access_token");
  assert.notEqual(
    refreshed.access_token,
    initial.access_token,
    "New access token must be different from the original"
  );
});

test("Public refreshAccessToken returns a NEW refresh token", () => {
  const store = createTokenStore();
  const initial = issueTokens("user_1", "mobile_ios_001", store);
  const refreshed = refreshAccessToken(
    initial.refresh_token,
    "mobile_ios_001",
    store
  );

  assert.notEqual(
    refreshed.refresh_token,
    initial.refresh_token,
    "INCIDENT_RESPONSE.md: refresh must return a NEW refresh token, not the same one"
  );
});

test("Public old refresh token is invalid after rotation", () => {
  const store = createTokenStore();
  const initial = issueTokens("user_1", "mobile_ios_001", store);
  // First refresh — rotates the token
  refreshAccessToken(initial.refresh_token, "mobile_ios_001", store);

  // Attempting to use the old refresh token should fail
  assert.throws(
    () => refreshAccessToken(initial.refresh_token, "mobile_ios_001", store),
    /revoke|invalid|replay|used|expired|family/i,
    "Old refresh token must not be accepted after rotation"
  );
});

test("Public revokeToken invalidates the token", () => {
  const store = createTokenStore();
  const initial = issueTokens("user_1", "mobile_ios_001", store);
  revokeToken(initial.refresh_token, store);

  assert.throws(
    () =>
      refreshAccessToken(initial.refresh_token, "mobile_ios_001", store),
    /revoke|invalid/i,
    "Revoked token must not be accepted"
  );
});

test("Public client mismatch is rejected", () => {
  const store = createTokenStore();
  const initial = issueTokens("user_1", "mobile_ios_001", store);

  assert.throws(
    () => refreshAccessToken(initial.refresh_token, "wrong_client", store),
    /client/i,
    "Must reject refresh from a different client"
  );
});

test("Public getTokenInfo returns token metadata", () => {
  const store = createTokenStore();
  const initial = issueTokens("user_1", "mobile_ios_001", store);

  const info = getTokenInfo(initial.refresh_token, store);
  assert.ok(info, "Must return token data");
  assert.equal(info.userId, "user_1");
  assert.equal(info.clientId, "mobile_ios_001");
});
