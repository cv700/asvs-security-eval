const crypto = require("node:crypto");

const sessions = new Map();

function createSession(res, username) {
  const sessionId = crypto.randomBytes(16).toString("hex");
  sessions.set(sessionId, { username, createdAt: Date.now() });

  // BUG: No Secure flag — cookies sent over HTTP get stripped by browser
  // after TLS termination at load balancer
  res.setHeader("Set-Cookie", `sid=${sessionId}; Path=/`);

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
  // Clear cookie without Secure flag
  res.setHeader(
    "Set-Cookie",
    `sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
}

function getSessionStore() {
  return sessions;
}

module.exports = { createSession, getSession, destroySession, getSessionStore };
