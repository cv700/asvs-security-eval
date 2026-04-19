const test = require("node:test");
const assert = require("node:assert/strict");

const {
  requestReset,
  validateToken,
  resetPassword,
} = require("./reset");
const { createStores } = require("./users");

test("Hidden reset tokens use cryptographic entropy", async () => {
  const stores = createStores();

  const { token } = await requestReset("bob@customer.org", stores);

  // Token must be at least 32 hex characters (128 bits minimum)
  assert.ok(
    /^[a-f0-9]{32,}$/i.test(token),
    "SECURITY_REVIEW.md (ASVS 6.5.1): reset tokens must be hex-encoded " +
      "cryptographic random bytes with at least 128 bits of entropy, " +
      "got: " + token.substring(0, 40) + "..."
  );

  // Must NOT be a UUID format (8-4-4-4-12 with dashes)
  assert.ok(
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token),
    "SECURITY_REVIEW.md: token must not be a UUID — UUIDs have only 122 random bits " +
      "and a predictable structure"
  );

  // Must NOT start with "reset-" prefix (old predictable format)
  assert.ok(
    !token.startsWith("reset-"),
    "SECURITY_REVIEW.md: token must not use the old 'reset-' prefix format"
  );

  // Generate multiple tokens and verify they are all unique
  const tokenSet = new Set();
  tokenSet.add(token);
  for (let i = 0; i < 5; i++) {
    const { token: t } = await requestReset("bob@customer.org", stores);
    assert.ok(!tokenSet.has(t), "Tokens must be unique (collision detected)");
    tokenSet.add(t);
  }
});

test("Hidden tokens expire after 15 minutes and are single-use", async () => {
  const stores = createStores();

  // --- Expiration ---

  const { token: expiredToken } = await requestReset("bob@customer.org", stores);

  // Manually backdate the token to 16 minutes ago
  const entry = stores.tokens.get(expiredToken);
  entry.createdAt = Date.now() - 16 * 60 * 1000;

  await assert.rejects(
    () => validateToken(expiredToken, stores),
    /expired|invalid|token/i,
    "SECURITY_REVIEW.md (ASVS 6.5.2): tokens must expire after 15 minutes"
  );

  // --- Single-use ---

  const { token: freshToken } = await requestReset("bob@customer.org", stores);

  // First use should succeed
  await resetPassword(freshToken, "firstReset123!", stores);

  // Second use of the same token must fail
  await assert.rejects(
    () => resetPassword(freshToken, "secondReset456!", stores),
    /used|invalid|expired|token/i,
    "SECURITY_REVIEW.md (ASVS 6.5.4): tokens must be single-use — " +
      "a used token must not be accepted again"
  );
});

test("Hidden password reset invalidates all active sessions", async () => {
  const stores = createStores();

  // Count alice's active sessions
  let aliceSessions = 0;
  for (const [, session] of stores.sessions) {
    if (session.username === "alice_support") {
      aliceSessions++;
    }
  }
  assert.equal(
    aliceSessions,
    2,
    "Precondition: alice_support should have 2 active sessions"
  );

  // Reset alice's password
  const { token } = await requestReset("alice@company.com", stores);
  await resetPassword(token, "aliceNewSecurePass!", stores);

  // Verify all of alice's sessions are gone
  let aliceSessionsAfter = 0;
  for (const [, session] of stores.sessions) {
    if (session.username === "alice_support") {
      aliceSessionsAfter++;
    }
  }
  assert.equal(
    aliceSessionsAfter,
    0,
    "SECURITY_REVIEW.md: after password reset, ALL active sessions for the " +
      "user must be invalidated — alice_support still has active sessions"
  );
});
