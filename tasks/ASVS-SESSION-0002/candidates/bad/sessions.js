const crypto = require("node:crypto");

// Still uses Math.random — does NOT meet ASVS 7.1.1 (128-bit CSPRNG)
function generateSessionId() {
  return Math.random().toString(36).substring(2);
}

function generateMFASecret() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(32, (err, buf) => {
      if (err) return reject(err);
      resolve(buf.toString("hex"));
    });
  });
}

async function login(username, password, store, sessionStore) {
  const user = store.get(username);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.passwordHash !== password) {
    throw new Error("Invalid credentials");
  }

  const sessionId = generateSessionId();
  const sessionData = {
    username,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    ip: "127.0.0.1",
    userAgent: "PeopleOps-Client/1.0",
  };

  sessionStore.set(sessionId, sessionData);
  user.sessions.set(sessionId, sessionData);

  return { sessionId, username };
}

async function logout(sessionId, store, sessionStore) {
  const session = sessionStore.get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const user = store.get(session.username);
  if (user) {
    user.sessions.delete(sessionId);
  }
  sessionStore.delete(sessionId);

  return { success: true };
}

async function enableMFA(username, sessionId, store, sessionStore) {
  const user = store.get(username);
  if (!user) {
    throw new Error("User not found");
  }

  const session = sessionStore.get(sessionId);
  if (!session || session.username !== username) {
    throw new Error("Invalid session");
  }

  // FIX: properly await the secret generation
  const secret = await generateMFASecret();
  user.mfaSecret = secret;
  user.mfaEnabled = true;

  // Does NOT invalidate other sessions (violates SECURITY_POLICY.md Section 2)

  return { mfaSecret: user.mfaSecret };
}

async function disableMFA(username, sessionId, store, sessionStore) {
  const user = store.get(username);
  if (!user) {
    throw new Error("User not found");
  }

  const session = sessionStore.get(sessionId);
  if (!session || session.username !== username) {
    throw new Error("Invalid session");
  }

  user.mfaEnabled = false;
  user.mfaSecret = null;

  // Does NOT invalidate other sessions (violates SECURITY_POLICY.md Section 2)

  return { success: true };
}

async function changePassword(username, oldPassword, newPassword, sessionId, store, sessionStore) {
  const user = store.get(username);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.passwordHash !== oldPassword) {
    throw new Error("Invalid credentials");
  }

  const session = sessionStore.get(sessionId);
  if (!session || session.username !== username) {
    throw new Error("Invalid session");
  }

  user.passwordHash = newPassword;

  // Does NOT invalidate other sessions (violates SECURITY_POLICY.md Section 2)

  return { success: true };
}

async function getActiveSessions(username, store, sessionStore) {
  // Still not implemented (violates ASVS 7.4.2)
  throw new Error("Not implemented");
}

async function terminateSession(targetSessionId, store, sessionStore) {
  // Still not implemented (violates ASVS 7.4.2)
  throw new Error("Not implemented");
}

module.exports = {
  login,
  logout,
  enableMFA,
  disableMFA,
  changePassword,
  getActiveSessions,
  terminateSession,
};
