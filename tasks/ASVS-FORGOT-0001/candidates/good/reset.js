const crypto = require("node:crypto");

const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

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
 *
 * SECURITY_REVIEW.md: Use crypto.randomBytes(32) for 256 bits of entropy.
 */
async function requestReset(email, stores) {
  const user = findUserByEmail(email, stores);
  if (!user) {
    throw new Error("Email not found");
  }

  const token = crypto.randomBytes(32).toString("hex");

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
 *
 * Checks: existence, expiration (15 min), single-use.
 */
async function validateToken(token, stores) {
  if (!stores.tokens.has(token)) {
    throw new Error("Invalid token");
  }

  const entry = stores.tokens.get(token);

  // SECURITY_REVIEW.md: tokens expire after 15 minutes
  if (Date.now() - entry.createdAt > TOKEN_EXPIRY_MS) {
    throw new Error("Token expired");
  }

  // SECURITY_REVIEW.md: tokens are single-use
  if (entry.used) {
    throw new Error("Token already used");
  }

  return entry;
}

/**
 * Reset a user's password using a valid reset token.
 *
 * After success: marks token used, invalidates all sessions for the user.
 */
async function resetPassword(token, newPassword, stores) {
  const entry = await validateToken(token, stores);

  const user = stores.users.get(entry.username);
  if (!user) {
    throw new Error("User not found");
  }

  user.password = newPassword;

  // SECURITY_REVIEW.md: mark token as used (single-use enforcement)
  entry.used = true;

  // SECURITY_REVIEW.md: invalidate ALL active sessions for this user
  if (user.sessions) {
    for (const sessionId of user.sessions) {
      stores.sessions.delete(sessionId);
    }
    user.sessions = [];
  }

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
