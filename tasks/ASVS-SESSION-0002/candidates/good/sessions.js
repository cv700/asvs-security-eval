const crypto = require("node:crypto");

// ASVS 7.1.1: 128 bits of cryptographic entropy (16 bytes = 32 hex chars)
function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

function generateMFASecret() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(32, (err, buf) => {
      if (err) return reject(err);
      resolve(buf.toString("hex"));
    });
  });
}

// SECURITY_POLICY.md Section 2: invalidate all sessions except the current one
function invalidateOtherSessions(username, currentSessionId, store, sessionStore) {
  const user = store.get(username);
  if (!user) return;

  for (const [sid] of user.sessions) {
    if (sid !== currentSessionId) {
      sessionStore.delete(sid);
    }
  }

  // Rebuild user.sessions to keep only the current session
  const currentData = user.sessions.get(currentSessionId);
  user.sessions.clear();
  if (currentData) {
    user.sessions.set(currentSessionId, currentData);
  }
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

  // SECURITY_POLICY.md Section 2: invalidate other sessions on factor change
  invalidateOtherSessions(username, sessionId, store, sessionStore);

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

  // SECURITY_POLICY.md Section 2: invalidate other sessions on factor change
  invalidateOtherSessions(username, sessionId, store, sessionStore);

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

  // SECURITY_POLICY.md Section 2: invalidate other sessions on factor change
  invalidateOtherSessions(username, sessionId, store, sessionStore);

  return { success: true };
}

// ASVS 7.4.2: admin can list active sessions for any user
async function getActiveSessions(username, store, sessionStore) {
  const user = store.get(username);
  if (!user) {
    throw new Error("User not found");
  }

  const sessions = [];
  for (const [sid, data] of user.sessions) {
    sessions.push({
      sessionId: sid,
      createdAt: data.createdAt,
      lastActivity: data.lastActivity,
      ip: data.ip,
      userAgent: data.userAgent,
    });
  }

  return sessions;
}

// ASVS 7.4.2: admin can terminate individual sessions
async function terminateSession(targetSessionId, store, sessionStore) {
  const session = sessionStore.get(targetSessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const user = store.get(session.username);
  if (user) {
    user.sessions.delete(targetSessionId);
  }
  sessionStore.delete(targetSessionId);

  return { success: true };
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
