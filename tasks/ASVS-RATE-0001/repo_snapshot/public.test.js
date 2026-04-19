const test = require("node:test");
const assert = require("node:assert/strict");

const { login, refreshToken, getLoginAttempts } = require("./auth");
const { createStore } = require("./store");

test("Public login succeeds with correct credentials", () => {
  const store = createStore();
  const result = login("alice_shop", "aliceShops2026!", "192.168.1.1", store);
  assert.ok(result.token, "Should return an access token");
  assert.ok(result.refreshToken, "Should return a refresh token");
});

test("Public login rejects wrong password", () => {
  const store = createStore();
  assert.throws(
    () => login("alice_shop", "wrongpassword", "192.168.1.1", store),
    { message: "Invalid credentials" }
  );
});

test("Public login rejects unknown user", () => {
  const store = createStore();
  assert.throws(
    () => login("nonexistent", "anypassword", "192.168.1.1", store),
    { message: "Invalid credentials" }
  );
});

test("Public rate limiting blocks after 5 failed attempts", () => {
  const store = createStore();
  const ip = "10.0.0.1";
  const username = "alice_shop";

  // 5 failed attempts
  for (let i = 0; i < 5; i++) {
    assert.throws(
      () => login(username, "wrongpassword", ip, store),
      { message: "Invalid credentials" }
    );
  }

  // 6th attempt should be rate limited
  assert.throws(
    () => login(username, "aliceShops2026!", ip, store),
    (err) => {
      return /rate|limit|locked|too many/i.test(err.message);
    },
    "6th attempt should be blocked by rate limiting"
  );
});

test("Public successful login resets rate limit counter", () => {
  const store = createStore();
  const ip = "10.0.0.2";
  const username = "alice_shop";

  // Fail 3 times
  for (let i = 0; i < 3; i++) {
    assert.throws(
      () => login(username, "wrongpassword", ip, store),
      { message: "Invalid credentials" }
    );
  }

  // Succeed — should reset the counter
  const result = login(username, "aliceShops2026!", ip, store);
  assert.ok(result.token);

  // Fail 3 more times — should still not be locked (counter was reset)
  for (let i = 0; i < 3; i++) {
    assert.throws(
      () => login(username, "wrongpassword", ip, store),
      { message: "Invalid credentials" }
    );
  }

  // 4th fail after reset — still under threshold, should get normal error
  assert.throws(
    () => login(username, "wrongpassword", ip, store),
    { message: "Invalid credentials" },
    "Should not be locked after only 4 fails since last reset"
  );
});

test("Public refresh token returns new access token", () => {
  const store = createStore();
  const result = refreshToken("refresh_bob_token_abc123", store);
  assert.ok(result.token, "Should return a new access token");
});

test("Public rate limit info is available", () => {
  const store = createStore();
  const ip = "10.0.0.3";
  const username = "alice_shop";

  // Fail a few times to create rate limit state
  for (let i = 0; i < 3; i++) {
    try {
      login(username, "wrongpassword", ip, store);
    } catch (e) {
      // expected
    }
  }

  const info = getLoginAttempts(username, ip, store);
  assert.ok(info, "Should return rate limit info");
  assert.equal(typeof info.attempts, "number", "Should include attempt count");
  assert.ok(info.attempts >= 3, "Should show at least 3 attempts");
});
