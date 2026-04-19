/**
 * Create a pre-populated user store representing the current production state.
 *
 * Users are employees of the organization using the PeopleOps HR portal.
 * carol_admin already has MFA enabled from an earlier pilot program.
 */
function createStore() {
  const store = new Map();

  // --- HR manager, MFA not yet enabled ---
  store.set("alice_hr", {
    username: "alice_hr",
    passwordHash: "aliceSecure123!",
    mfaEnabled: false,
    mfaSecret: null,
    sessions: new Map(),
    createdAt: "2025-11-01",
  });

  // --- Developer, MFA not yet enabled ---
  store.set("bob_dev", {
    username: "bob_dev",
    passwordHash: "bobDeveloper1!",
    mfaEnabled: false,
    mfaSecret: null,
    sessions: new Map(),
    createdAt: "2025-12-15",
  });

  // --- Admin user, MFA already enabled from pilot ---
  store.set("carol_admin", {
    username: "carol_admin",
    passwordHash: "carolAdmin2026!",
    mfaEnabled: true,
    mfaSecret: "a1b2c3d4e5f6a7b8a1b2c3d4e5f6a7b8a1b2c3d4e5f6a7b8a1b2c3d4e5f6a7b8",
    sessions: new Map(),
    createdAt: "2025-10-05",
  });

  return store;
}

/**
 * Create a session store that tracks all active sessions across users.
 * Maps sessionId -> { username, createdAt, lastActivity, ip, userAgent }
 */
function createSessionStore() {
  return new Map();
}

module.exports = { createStore, createSessionStore };
