const crypto = require("node:crypto");

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculate lockout duration based on cumulative failures.
 * RATE_LIMIT_PLAN.md: exponential backoff, not permanent lockout.
 *   5 fails  -> 1 minute
 *   10 fails -> 5 minutes
 *   15 fails -> 15 minutes
 */
function getLockoutDuration(attempts) {
  if (attempts >= 15) return 15 * 60 * 1000;
  if (attempts >= 10) return 5 * 60 * 1000;
  if (attempts >= 5) return 1 * 60 * 1000;
  return 0;
}

function login(username, password, ip, store) {
  const user = store.users.get(username);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // RATE_LIMIT_PLAN.md: Key by IP + username combination
  const key = `${ip}:${username}`;
  const now = Date.now();
  let rateInfo = store.rateLimits.get(key);

  if (!rateInfo) {
    rateInfo = { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
    store.rateLimits.set(key, rateInfo);
  }

  // Check if currently locked out
  if (rateInfo.lockedUntil > now) {
    throw new Error(
      "Too many failed attempts. Try again later."
    );
  }

  // Verify credentials
  if (user.password !== password) {
    rateInfo.attempts += 1;
    rateInfo.lastAttempt = now;

    // RATE_LIMIT_PLAN.md: Logging — timestamp, IP, username (NOT password)
    if (!store.auditLog) store.auditLog = [];
    store.auditLog.push({ timestamp: now, ip, username });

    // Calculate lockout if threshold reached
    const lockout = getLockoutDuration(rateInfo.attempts);
    if (lockout > 0) {
      rateInfo.lockedUntil = now + lockout;
    }

    throw new Error("Invalid credentials");
  }

  // RATE_LIMIT_PLAN.md: Successful login resets failure counter
  const remaining = 5 - 0; // Reset, so full allowance
  rateInfo.attempts = 0;
  rateInfo.lastAttempt = 0;
  rateInfo.lockedUntil = 0;

  const token = generateToken();
  const refreshTk = generateToken();

  store.sessions.set(refreshTk, {
    username,
    type: "refresh",
    createdAt: Date.now(),
  });

  // RATE_LIMIT_PLAN.md: Include rate limit metadata in response
  return {
    token,
    refreshToken: refreshTk,
    rateLimitRemaining: 5,
    rateLimitReset: 0,
  };
}

// MOBILE_APP_COMPATIBILITY.md: Refresh endpoint is NOT rate limited
function refreshToken(token, store) {
  const session = store.sessions.get(token);
  if (!session || session.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }

  const newToken = generateToken();
  return { token: newToken };
}

function getLoginAttempts(username, ip, store) {
  // RATE_LIMIT_PLAN.md: Keyed by IP + username
  const key = `${ip}:${username}`;
  const rateInfo = store.rateLimits.get(key);
  if (!rateInfo) {
    return { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
  }
  return { ...rateInfo };
}

module.exports = { login, refreshToken, getLoginAttempts };
