const crypto = require("node:crypto");

/**
 * Create pre-populated stores representing the current production state.
 *
 * Returns {users, tokens, sessions} — three Maps used by the reset module.
 */
function createStores() {
  const users = new Map();
  const tokens = new Map();
  const sessions = new Map();

  // --- Users ---

  users.set("alice_support", {
    username: "alice_support",
    password: "aliceSupport123!",
    email: "alice@company.com",
    sessions: [],
  });

  users.set("bob_customer", {
    username: "bob_customer",
    password: "bobCustomer456!",
    email: "bob@customer.org",
    sessions: [],
  });

  users.set("carol_manager", {
    username: "carol_manager",
    password: "carolManager789!",
    email: "carol@company.com",
    sessions: [],
  });

  // --- Pre-populated token (expired-style, for testing) ---

  const oldToken = "reset-" + (Date.now() - 7200000).toString(36) + "-ab12";
  tokens.set(oldToken, {
    username: "bob_customer",
    createdAt: Date.now() - 7200000,
    used: false,
  });

  // --- Active sessions ---

  const aliceSession1 = crypto.randomBytes(16).toString("hex");
  const aliceSession2 = crypto.randomBytes(16).toString("hex");
  sessions.set(aliceSession1, {
    username: "alice_support",
    createdAt: Date.now() - 3600000,
  });
  sessions.set(aliceSession2, {
    username: "alice_support",
    createdAt: Date.now() - 1800000,
  });
  users.get("alice_support").sessions.push(aliceSession1, aliceSession2);

  const bobSession1 = crypto.randomBytes(16).toString("hex");
  sessions.set(bobSession1, {
    username: "bob_customer",
    createdAt: Date.now() - 600000,
  });
  users.get("bob_customer").sessions.push(bobSession1);

  return { users, tokens, sessions };
}

module.exports = { createStores };
