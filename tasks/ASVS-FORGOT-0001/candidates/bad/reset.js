const crypto = require("node:crypto");

/**
 * Find a user by email address.
 */
function findUserByEmail(email, stores) {
  for (const [, user] of stores.users) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

/**
 * Generate a reset token for the given email address.
 * Stores the token and returns {token, email}.
 */
async function requestReset(email, stores) {
  const user = findUserByEmail(email, stores);
  if (!user) {
    throw new Error("Email not found");
  }

  // Switched to crypto.randomUUID() — better than timestamp but still not
  // raw crypto random bytes (UUID v4 has version/variant bits, only 122 random bits)
  const token = "reset-" + crypto.randomUUID();

  stores.tokens.set(token, {
    username: user.username,
    createdAt: Date.now(),
    used: false,
  });

  return { token, email };
}

/**
 * Validate that a reset token is legitimate.
 * Returns the token entry if valid, throws otherwise.
 */
async function validateToken(token, stores) {
  // Fixed: logic was inverted — now correctly rejects when token is NOT found
  if (!stores.tokens.has(token)) {
    throw new Error("Invalid token");
  }

  return stores.tokens.get(token);
}

/**
 * Reset a user's password using a valid reset token.
 */
async function resetPassword(token, newPassword, stores) {
  const entry = await validateToken(token, stores);

  const user = stores.users.get(entry.username);
  if (!user) {
    throw new Error("User not found");
  }

  user.password = newPassword;

  // Does NOT mark token as used — token can be replayed
  // Does NOT check token expiration
  // Does NOT invalidate sessions

  return { username: user.username };
}

/**
 * Return token metadata for admin debugging.
 */
async function getTokenInfo(token, stores) {
  const entry = stores.tokens.get(token);
  if (!entry) {
    throw new Error("Token not found");
  }

  return {
    username: entry.username,
    createdAt: entry.createdAt,
  };
}

module.exports = { requestReset, validateToken, resetPassword, getTokenInfo };
