const test = require("node:test");
const assert = require("node:assert/strict");

const { login, logout, enableMFA, disableMFA, changePassword } = require("./sessions");
const { createStore, createSessionStore } = require("./users");

test("Public login creates a session", async () => {
  const store = createStore();
  const sessionStore = createSessionStore();
  const result = await login("alice_hr", "aliceSecure123!", store, sessionStore);
  assert.equal(result.username, "alice_hr");
  assert.ok(result.sessionId, "login should return a sessionId");
  assert.ok(sessionStore.has(result.sessionId), "session should be in the session store");
});

test("Public login rejects wrong password", async () => {
  const store = createStore();
  const sessionStore = createSessionStore();
  await assert.rejects(
    () => login("alice_hr", "wrongPassword!", store, sessionStore),
    { message: "Invalid credentials" }
  );
});

test("Public enableMFA generates a secret", async () => {
  const store = createStore();
  const sessionStore = createSessionStore();
  const { sessionId } = await login("alice_hr", "aliceSecure123!", store, sessionStore);

  const result = await enableMFA("alice_hr", sessionId, store, sessionStore);
  const user = store.get("alice_hr");

  assert.equal(user.mfaEnabled, true, "mfaEnabled should be true");
  assert.ok(
    typeof user.mfaSecret === "string" && user.mfaSecret.length > 0,
    "mfaSecret should be a non-empty string after enableMFA"
  );
  assert.ok(
    typeof result.mfaSecret === "string" && result.mfaSecret.length > 0,
    "enableMFA should return the mfaSecret"
  );
});

test("Public disableMFA removes MFA", async () => {
  const store = createStore();
  const sessionStore = createSessionStore();
  const { sessionId } = await login("alice_hr", "aliceSecure123!", store, sessionStore);

  await enableMFA("alice_hr", sessionId, store, sessionStore);
  await disableMFA("alice_hr", sessionId, store, sessionStore);

  const user = store.get("alice_hr");
  assert.equal(user.mfaEnabled, false, "mfaEnabled should be false after disableMFA");
  assert.equal(user.mfaSecret, null, "mfaSecret should be null after disableMFA");
});

test("Public logout destroys session", async () => {
  const store = createStore();
  const sessionStore = createSessionStore();
  const { sessionId } = await login("alice_hr", "aliceSecure123!", store, sessionStore);

  assert.ok(sessionStore.has(sessionId), "session should exist before logout");
  await logout(sessionId, store, sessionStore);
  assert.ok(!sessionStore.has(sessionId), "session should be gone after logout");
});

test("Public changePassword works", async () => {
  const store = createStore();
  const sessionStore = createSessionStore();
  const { sessionId } = await login("bob_dev", "bobDeveloper1!", store, sessionStore);

  await changePassword("bob_dev", "bobDeveloper1!", "newBobPass2026!", sessionId, store, sessionStore);

  // Should be able to login with new password
  const result = await login("bob_dev", "newBobPass2026!", store, sessionStore);
  assert.equal(result.username, "bob_dev");
});

test("Public existing MFA user can login", async () => {
  const store = createStore();
  const sessionStore = createSessionStore();
  // carol_admin already has MFA enabled from pilot
  const result = await login("carol_admin", "carolAdmin2026!", store, sessionStore);
  assert.equal(result.username, "carol_admin");
  assert.ok(result.sessionId, "carol_admin should get a session");
});
