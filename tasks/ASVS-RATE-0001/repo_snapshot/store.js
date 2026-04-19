const crypto = require("node:crypto");

/**
 * Create a pre-populated store representing the current production state.
 *
 * - users: Map of username -> {username, password, email}
 * - rateLimits: Map of key -> {attempts, lastAttempt, lockedUntil}
 * - sessions: Map of token -> {username, type, createdAt}
 */
function createStore() {
  const users = new Map();

  users.set("alice_shop", {
    username: "alice_shop",
    password: "aliceShops2026!",
    email: "alice@example.com",
  });

  users.set("bob_buyer", {
    username: "bob_buyer",
    password: "bobBuysThings1!",
    email: "bob@example.com",
  });

  users.set("carol_seller", {
    username: "carol_seller",
    password: "carolSells123!",
    email: "carol@example.com",
  });

  // Rate limit state accumulates during operation
  const rateLimits = new Map();

  // Sessions — pre-populated with a refresh token for bob
  const sessions = new Map();
  sessions.set("refresh_bob_token_abc123", {
    username: "bob_buyer",
    type: "refresh",
    createdAt: Date.now(),
  });

  return { users, rateLimits, sessions };
}

module.exports = { createStore };
