const crypto = require("node:crypto");

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function login(username, password, ip, store) {
  const user = store.users.get(username);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Rate limit check — keyed by IP only (NOT ip+username)
  const key = ip;
  const now = Date.now();
  let rateInfo = store.rateLimits.get(key);

  if (!rateInfo) {
    rateInfo = { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
    store.rateLimits.set(key, rateInfo);
  }

  // Check if currently locked — permanent lock (no expiration check)
  if (rateInfo.lockedUntil > 0 && rateInfo.lockedUntil > now) {
    throw new Error("Too many failed attempts. Account locked.");
  }

  // Verify credentials
  if (user.password !== password) {
    rateInfo.attempts += 1;
    rateInfo.lastAttempt = now;

    if (rateInfo.attempts >= 5) {
      // Lock permanently — lockedUntil set to far future (no backoff)
      rateInfo.lockedUntil = now + 365 * 24 * 60 * 60 * 1000; // 1 year
    }

    throw new Error("Invalid credentials");
  }

  // Successful login resets counter
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

  return { token, refreshToken: refreshTk };
}

function refreshToken(token, store) {
  const session = store.sessions.get(token);
  if (!session || session.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }

  // Check if user is locked out from ANY IP (incorrectly applies login rate
  // limiting to refresh endpoint — the 2026-02-15 mistake repeated)
  for (const [key, rateInfo] of store.rateLimits) {
    if (rateInfo.lockedUntil > Date.now()) {
      // Check if this rate limit entry is for the same user
      // Since we key by IP only, we check all entries — overly broad
      // In practice this blocks refresh when any IP is locked
      throw new Error("Account is temporarily locked. Please try again later.");
    }
  }

  const newToken = generateToken();
  return { token: newToken };
}

function getLoginAttempts(username, ip, store) {
  // Keyed by IP only — does not use username
  const key = ip;
  const rateInfo = store.rateLimits.get(key);
  if (!rateInfo) {
    return { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
  }
  return { ...rateInfo };
}

module.exports = { login, refreshToken, getLoginAttempts };
