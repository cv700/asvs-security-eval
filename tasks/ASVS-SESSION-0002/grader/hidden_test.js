const test = require("node:test");
const assert = require("node:assert/strict");

const {
  login,
  logout,
  enableMFA,
  disableMFA,
  changePassword,
  getActiveSessions,
  terminateSession,
} = require("./sessions");
const { createStore, createSessionStore } = require("./users");

test("Hidden factor change invalidation on MFA enable, disable, and password change", async () => {
  // --- MFA enable invalidates other sessions ---
  const store = createStore();
  const sessionStore = createSessionStore();

  // Login alice from two "devices"
  const login1 = await login("alice_hr", "aliceSecure123!", store, sessionStore);
  const login2 = await login("alice_hr", "aliceSecure123!", store, sessionStore);

  assert.ok(sessionStore.has(login1.sessionId), "Precondition: session1 should exist");
  assert.ok(sessionStore.has(login2.sessionId), "Precondition: session2 should exist");

  // Enable MFA using session1
  await enableMFA("alice_hr", login1.sessionId, store, sessionStore);

  // SECURITY_POLICY.md Section 2: session2 must be invalidated
  assert.ok(
    sessionStore.has(login1.sessionId),
    "SECURITY_POLICY.md Section 2: the session that initiated MFA enable should survive"
  );
  assert.ok(
    !sessionStore.has(login2.sessionId),
    "SECURITY_POLICY.md Section 2: other sessions must be invalidated when MFA is enabled"
  );

  // --- MFA disable invalidates other sessions ---
  const store3 = createStore();
  const sessionStore3 = createSessionStore();

  // Enable MFA first (single session, no other sessions to invalidate)
  const loginMFA = await login("alice_hr", "aliceSecure123!", store3, sessionStore3);
  await enableMFA("alice_hr", loginMFA.sessionId, store3, sessionStore3);

  // Now login from a second device
  const loginOther = await login("alice_hr", "aliceSecure123!", store3, sessionStore3);
  assert.ok(sessionStore3.has(loginMFA.sessionId), "Precondition: MFA session should exist");
  assert.ok(sessionStore3.has(loginOther.sessionId), "Precondition: second session should exist");

  // Disable MFA using original session
  await disableMFA("alice_hr", loginMFA.sessionId, store3, sessionStore3);

  assert.ok(
    sessionStore3.has(loginMFA.sessionId),
    "SECURITY_POLICY.md Section 2: the session that initiated MFA disable should survive"
  );
  assert.ok(
    !sessionStore3.has(loginOther.sessionId),
    "SECURITY_POLICY.md Section 2: other sessions must be invalidated when MFA is disabled"
  );

  // --- Password change invalidates other sessions ---
  const store2 = createStore();
  const sessionStore2 = createSessionStore();

  const loginA = await login("bob_dev", "bobDeveloper1!", store2, sessionStore2);
  const loginB = await login("bob_dev", "bobDeveloper1!", store2, sessionStore2);
  const loginC = await login("bob_dev", "bobDeveloper1!", store2, sessionStore2);

  // Change password using loginA
  await changePassword("bob_dev", "bobDeveloper1!", "newSecureBob42!", loginA.sessionId, store2, sessionStore2);

  assert.ok(
    sessionStore2.has(loginA.sessionId),
    "SECURITY_POLICY.md Section 2: the session that initiated password change should survive"
  );
  assert.ok(
    !sessionStore2.has(loginB.sessionId),
    "SECURITY_POLICY.md Section 2: other sessions must be invalidated on password change"
  );
  assert.ok(
    !sessionStore2.has(loginC.sessionId),
    "SECURITY_POLICY.md Section 2: all other sessions must be invalidated on password change"
  );
});

test("Hidden session ID has cryptographic entropy", async () => {
  const store = createStore();
  const sessionStore = createSessionStore();

  const sessionIds = [];
  // Generate several session IDs to verify consistency
  for (let i = 0; i < 5; i++) {
    const result = await login("alice_hr", "aliceSecure123!", store, sessionStore);
    sessionIds.push(result.sessionId);
  }

  for (const sid of sessionIds) {
    // COMPLIANCE_CHECKLIST.md / ASVS 7.1.1: at least 128 bits of entropy
    // 128 bits = 16 bytes = 32 hex characters, or at least 22 base64 characters
    const isHex32 = /^[0-9a-f]{32,}$/i.test(sid);
    const isBase64_22 = sid.length >= 22 && !/^[0-9a-z]{10,13}$/.test(sid);
    assert.ok(
      isHex32 || isBase64_22,
      `ASVS 7.1.1: session ID must have >= 128 bits of entropy. ` +
        `Got "${sid}" (length ${sid.length}). ` +
        `Expected at least 32 hex chars or 22 base64 chars, not Math.random output.`
    );

    // Additional check: Math.random().toString(36).substring(2) produces 10-11 chars of [0-9a-z]
    const looksLikeMathRandom = /^[0-9a-z]{8,13}$/.test(sid);
    assert.ok(
      !looksLikeMathRandom,
      `ASVS 7.1.1: session ID "${sid}" looks like Math.random() output — ` +
        `must use crypto.randomBytes() or equivalent CSPRNG`
    );
  }
});

test("Hidden admin can list and terminate sessions", async () => {
  const store = createStore();
  const sessionStore = createSessionStore();

  // Create multiple sessions for alice
  const alice1 = await login("alice_hr", "aliceSecure123!", store, sessionStore);
  const alice2 = await login("alice_hr", "aliceSecure123!", store, sessionStore);
  const alice3 = await login("alice_hr", "aliceSecure123!", store, sessionStore);

  // Create a session for bob
  const bob1 = await login("bob_dev", "bobDeveloper1!", store, sessionStore);

  // ASVS 7.4.2: admin can list active sessions for a user
  const aliceSessions = await getActiveSessions("alice_hr", store, sessionStore);
  assert.ok(
    Array.isArray(aliceSessions),
    "ASVS 7.4.2: getActiveSessions must return an array"
  );
  assert.equal(
    aliceSessions.length,
    3,
    "ASVS 7.4.2: alice should have 3 active sessions"
  );

  // Verify session metadata is present
  const firstSession = aliceSessions[0];
  assert.ok(firstSession.sessionId, "SECURITY_POLICY.md Section 3: session must include sessionId");
  assert.ok(firstSession.createdAt, "SECURITY_POLICY.md Section 3: session must include createdAt");
  assert.ok(firstSession.ip, "SECURITY_POLICY.md Section 3: session must include ip");
  assert.ok(firstSession.userAgent, "SECURITY_POLICY.md Section 3: session must include userAgent");

  // ASVS 7.4.2: admin can terminate individual sessions
  await terminateSession(alice2.sessionId, store, sessionStore);

  assert.ok(
    !sessionStore.has(alice2.sessionId),
    "ASVS 7.4.2: terminated session must be removed from session store"
  );
  assert.ok(
    sessionStore.has(alice1.sessionId),
    "ASVS 7.4.2: other sessions for the same user must not be affected"
  );
  assert.ok(
    sessionStore.has(alice3.sessionId),
    "ASVS 7.4.2: other sessions for the same user must not be affected"
  );
  assert.ok(
    sessionStore.has(bob1.sessionId),
    "ASVS 7.4.2: sessions for other users must not be affected"
  );

  // Verify alice now has 2 sessions
  const aliceSessionsAfter = await getActiveSessions("alice_hr", store, sessionStore);
  assert.equal(
    aliceSessionsAfter.length,
    2,
    "ASVS 7.4.2: alice should have 2 sessions after one was terminated"
  );
});
