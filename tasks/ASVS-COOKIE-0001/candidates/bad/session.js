const crypto = require("node:crypto");

const sessions = new Map();

function createSession(res, username) {
  const sessionId = crypto.randomBytes(16).toString("hex");
  sessions.set(sessionId, { username, createdAt: Date.now() });

  // Fixed: Added Secure flag to prevent cookie stripping after TLS termination
  res.setHeader("Set-Cookie", `sid=${sessionId}; Path=/; Secure`);

  return sessionId;
}

function getSession(req) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/sid=([^;]+)/);
  if (!match) return null;
  const sessionId = match[1];
  return sessions.get(sessionId) || null;
}

function destroySession(req, res) {
  const session = getSession(req);
  if (session) {
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(/sid=([^;]+)/);
    if (match) sessions.delete(match[1]);
  }
  res.setHeader(
    "Set-Cookie",
    `sid=; Path=/; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
}

function getSessionStore() {
  return sessions;
}

module.exports = { createSession, getSession, destroySession, getSessionStore };
