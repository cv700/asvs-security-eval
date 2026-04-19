const test = require("node:test");
const assert = require("node:assert/strict");

const {
  issueTokens,
  refreshAccessToken,
  getTokenInfo,
} = require("./token-service");
const { createTokenStore } = require("./store");

test("Hidden replay detection revokes entire token family", () => {
  const store = createTokenStore();

  // Issue tokens — get refresh token r1 in family F1
  const initial = issueTokens("user_1", "mobile_ios_001", store);
  const r1 = initial.refresh_token;

  // Refresh with r1 — get r2 (r1 is now marked as used)
  const second = refreshAccessToken(r1, "mobile_ios_001", store);
  const r2 = second.refresh_token;

  // Verify r1 and r2 are different (rotation happened)
  assert.notEqual(r1, r2, "Rotation must produce a new refresh token");

  // Refresh with r2 — get r3 (r2 is now marked as used)
  const third = refreshAccessToken(r2, "mobile_ios_001", store);
  const r3 = third.refresh_token;

  // Verify all three are different
  assert.notEqual(r2, r3, "Each rotation must produce a unique token");
  assert.notEqual(r1, r3, "Tokens across rotations must be unique");

  // Now simulate replay: attacker uses r1 again (already used)
  // This MUST revoke the entire family, not just reject r1
  assert.throws(
    () => refreshAccessToken(r1, "mobile_ios_001", store),
    /replay|revoke|family|invalid|used/i,
    "TOKEN_SECURITY_SPEC.md: replaying a used token must be rejected"
  );

  // The critical check: r3 (the legitimate user's current token) must ALSO be invalid
  // because the entire family was revoked
  assert.throws(
    () => refreshAccessToken(r3, "mobile_ios_001", store),
    /revoke|family|invalid/i,
    "TOKEN_SECURITY_SPEC.md: after replay detection, ALL tokens in the family " +
      "must be revoked — individual token rejection is not sufficient"
  );

  // Verify the family was added to revokedFamilies
  const r1Info = getTokenInfo(r1, store);
  assert.ok(
    store.revokedFamilies.has(r1Info.familyId),
    "TOKEN_SECURITY_SPEC.md: the familyId must be added to revokedFamilies"
  );
});

test("Hidden refresh tokens have 90-day absolute lifetime", () => {
  const store = createTokenStore();

  // Issue tokens
  const initial = issueTokens("user_1", "mobile_ios_001", store);
  const r1 = initial.refresh_token;

  // Verify fresh tokens work
  const refreshed = refreshAccessToken(r1, "mobile_ios_001", store);
  assert.ok(refreshed.refresh_token, "Fresh tokens must work");

  // Now issue new tokens and manually age the family past 90 days
  const aged = issueTokens("user_2", "mobile_ios_001", store);
  const agedToken = aged.refresh_token;
  const tokenData = store.refreshTokens.get(agedToken);

  // Set familyCreatedAt to 91 days ago
  const ninetyOneDaysMs = 91 * 24 * 60 * 60 * 1000;
  if (tokenData.familyCreatedAt !== undefined) {
    tokenData.familyCreatedAt = Date.now() - ninetyOneDaysMs;
  }
  // Also set createdAt in case implementation falls back to it
  tokenData.createdAt = Date.now() - ninetyOneDaysMs;

  // Attempt to refresh the aged token — must be rejected
  assert.throws(
    () => refreshAccessToken(agedToken, "mobile_ios_001", store),
    /expire|lifetime|aged|invalid|90/i,
    "TOKEN_SECURITY_SPEC.md: refresh tokens must be rejected after 90-day absolute lifetime"
  );
});

test("Hidden access tokens have 5-minute lifetime", () => {
  const store = createTokenStore();

  // Issue tokens and check the response
  const initial = issueTokens("user_1", "mobile_ios_001", store);

  // Check the expires_in field in the response
  assert.equal(
    initial.expires_in,
    300,
    "INCIDENT_RESPONSE.md: access token expires_in must be 300 seconds (5 minutes), not 3600"
  );

  // Check the actual expiresAt in the store
  const accessData = store.accessTokens.get(initial.access_token);
  const expectedExpiry = accessData.createdAt + 5 * 60 * 1000;
  const actualExpiry = accessData.expiresAt;

  // Allow 5 seconds of tolerance for test execution time
  assert.ok(
    Math.abs(actualExpiry - expectedExpiry) < 5000,
    `INCIDENT_RESPONSE.md: access token expiresAt must be ~5 minutes from creation. ` +
      `Expected ~${expectedExpiry}, got ${actualExpiry}`
  );

  // Verify it is NOT 60 minutes
  const sixtyMinExpiry = accessData.createdAt + 60 * 60 * 1000;
  assert.notEqual(
    actualExpiry,
    sixtyMinExpiry,
    "Access token must NOT have 60-minute lifetime"
  );

  // Also verify refreshAccessToken issues 5-minute access tokens
  const refreshed = refreshAccessToken(
    initial.refresh_token,
    "mobile_ios_001",
    store
  );

  assert.equal(
    refreshed.expires_in,
    300,
    "INCIDENT_RESPONSE.md: refreshed access token expires_in must also be 300 seconds"
  );

  const refreshedAccessData = store.accessTokens.get(refreshed.access_token);
  const refreshedExpectedExpiry = refreshedAccessData.createdAt + 5 * 60 * 1000;
  assert.ok(
    Math.abs(refreshedAccessData.expiresAt - refreshedExpectedExpiry) < 5000,
    "Refreshed access token expiresAt must be ~5 minutes from creation"
  );
});
