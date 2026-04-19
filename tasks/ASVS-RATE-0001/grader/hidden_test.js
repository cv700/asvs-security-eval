const test = require("node:test");
const assert = require("node:assert/strict");

const { login, refreshToken, getLoginAttempts } = require("./auth");
const { createStore } = require("./store");

test("Hidden rate limit uses IP+username keying not IP-only", () => {
  const store = createStore();
  const ip = "1.2.3.4";

  // Fail 5 logins for alice_shop from this IP — should lock alice_shop+IP
  for (let i = 0; i < 5; i++) {
    assert.throws(
      () => login("alice_shop", "wrongpassword", ip, store),
      { message: "Invalid credentials" }
    );
  }

  // Verify alice is now locked from this IP
  assert.throws(
    () => login("alice_shop", "aliceShops2026!", ip, store),
    (err) => /rate|limit|locked|too many/i.test(err.message),
    "RATE_LIMIT_PLAN.md: alice_shop should be locked from IP 1.2.3.4 after 5 fails"
  );

  // bob_buyer from the SAME IP should NOT be blocked
  // If keyed by IP only, bob would also be blocked
  const result = login("bob_buyer", "bobBuysThings1!", ip, store);
  assert.ok(
    result.token,
    "RATE_LIMIT_PLAN.md: rate limit must be keyed by IP+username, not IP-only. " +
      "bob_buyer from the same IP must not be blocked by alice_shop's failures."
  );
});

test("Hidden lockout uses exponential backoff not permanent lock", () => {
  const store = createStore();
  const ip = "5.6.7.8";

  // Fail 5 logins for alice_shop — triggers first lockout
  for (let i = 0; i < 5; i++) {
    assert.throws(
      () => login("alice_shop", "wrongpassword", ip, store),
      { message: "Invalid credentials" }
    );
  }

  // Check rate limit info
  const info = getLoginAttempts("alice_shop", ip, store);
  assert.ok(info, "getLoginAttempts should return rate limit info");
  assert.ok(info.attempts >= 5, "Should show at least 5 attempts");

  // lockedUntil must exist and be a finite timestamp in the future
  assert.ok(
    typeof info.lockedUntil === "number" && info.lockedUntil > 0,
    "RATE_LIMIT_PLAN.md: lockedUntil must be a positive timestamp (not permanent)"
  );

  const now = Date.now();

  // lockedUntil should be in the future
  assert.ok(
    info.lockedUntil > now,
    "lockedUntil should be in the future"
  );

  // First lockout is 1 minute per RATE_LIMIT_PLAN.md
  // lockedUntil should NOT be more than 2 minutes from now (tolerance for test execution)
  const twoMinutesFromNow = now + 2 * 60 * 1000;
  assert.ok(
    info.lockedUntil <= twoMinutesFromNow,
    "RATE_LIMIT_PLAN.md: first lockout should be ~1 minute, not permanent. " +
      "lockedUntil is " + ((info.lockedUntil - now) / 1000).toFixed(0) +
      " seconds from now, expected ~60 seconds"
  );

  // Verify it is NOT a permanent lock (e.g., not set to 1 year or Infinity)
  const oneHourFromNow = now + 60 * 60 * 1000;
  assert.ok(
    info.lockedUntil < oneHourFromNow,
    "RATE_LIMIT_PLAN.md: lockout must be exponential backoff, not permanent. " +
      "lockedUntil should not be more than 1 hour from now for a first lockout."
  );
});

test("Hidden refresh endpoint is not rate limited", () => {
  const store = createStore();
  const ip = "9.10.11.12";

  // Fail 5 logins for bob_buyer — bob is now locked from this IP for login
  for (let i = 0; i < 5; i++) {
    assert.throws(
      () => login("bob_buyer", "wrongpassword", ip, store),
      { message: "Invalid credentials" }
    );
  }

  // Verify bob is locked for login
  assert.throws(
    () => login("bob_buyer", "bobBuysThings1!", ip, store),
    (err) => /rate|limit|locked|too many/i.test(err.message),
    "Precondition: bob_buyer should be rate-limited for login"
  );

  // MOBILE_APP_COMPATIBILITY.md: refresh endpoint must NOT be rate limited
  // Bob's pre-existing refresh token should still work
  const result = refreshToken("refresh_bob_token_abc123", store);
  assert.ok(
    result.token,
    "MOBILE_APP_COMPATIBILITY.md: refresh endpoint must not be subject to login rate limiting. " +
      "bob_buyer's refresh token must work even when login is rate-limited."
  );

  // Call refresh 5 more times rapidly — all must succeed (no rate limiting on refresh)
  for (let i = 0; i < 5; i++) {
    const r = refreshToken("refresh_bob_token_abc123", store);
    assert.ok(
      r.token,
      "MOBILE_APP_COMPATIBILITY.md: rapid refresh calls must all succeed. " +
        "Call " + (i + 2) + " of 6 failed."
    );
  }
});
