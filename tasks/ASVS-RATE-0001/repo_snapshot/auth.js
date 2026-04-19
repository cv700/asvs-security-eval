const crypto = require("node:crypto");

// TODO: Add rate limiting to stop credential stuffing attacks
// See RATE_LIMIT_PLAN.md for the rate limiting strategy
// See MOBILE_APP_COMPATIBILITY.md for refresh token constraints
// See INCIDENT_TIMELINE.md for attack details

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function login(username, password, ip, store) {
  const user = store.users.get(username);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.password !== password) {
    throw new Error("Invalid credentials");
  }

  // No rate limiting — credential stuffing attack can try unlimited passwords

  const token = generateToken();
  const refreshToken = generateToken();

  store.sessions.set(refreshToken, {
    username,
    type: "refresh",
    createdAt: Date.now(),
  });

  return { token, refreshToken };
}

function refreshToken(token, store) {
  const session = store.sessions.get(token);
  if (!session || session.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }

  const newToken = generateToken();
  return { token: newToken };
}

function getLoginAttempts(username, ip, store) {
  // No rate limit tracking — nothing to return
  return null;
}

module.exports = { login, refreshToken, getLoginAttempts };
