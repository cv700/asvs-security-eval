const crypto = require("node:crypto");

const sessions = new Map();

const COOKIE_ATTRS = "Path=/; Secure; HttpOnly; SameSite=Lax";

function createSession(res, username) {
  const sessionId = crypto.randomBytes(16).toString("hex");
  sessions.set(sessionId, { username, createdAt: Date.now() });

  // HTTPS_MIGRATION.md: Use __Host- prefix, Secure, HttpOnly, SameSite=Lax
  // SECURITY_AUDIT.md: ASVS 7.1.3, 3.4.1, 3.4.2, 3.4.5
  // No Domain attribute — scoped to exact host per ASVS 3.4.3
  res.setHeader("Set-Cookie", `__Host-sid=${sessionId}; ${COOKIE_ATTRS}`);

  return sessionId;
}

function parseCookie(cookieHeader, name) {
  // Robust parsing: handle whitespace, multiple cookies
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key === name) return value;
  }
  return null;
}

function getSession(req) {
  const cookieHeader = req.headers.cookie || "";

  // HTTPS_MIGRATION.md: Accept both new __Host-sid and legacy sid during transition
  let sessionId = parseCookie(cookieHeader, "__Host-sid");
  if (!sessionId) {
    sessionId = parseCookie(cookieHeader, "sid");
  }

  if (!sessionId) return null;
  return sessions.get(sessionId) || null;
}

function destroySession(req, res) {
  const cookieHeader = req.headers.cookie || "";

  // Delete session from store
  const newId = parseCookie(cookieHeader, "__Host-sid");
  const oldId = parseCookie(cookieHeader, "sid");
  if (newId && sessions.has(newId)) sessions.delete(newId);
  if (oldId && sessions.has(oldId)) sessions.delete(oldId);

  // Clear both cookie names during transition period
  res.setHeader("Set-Cookie", [
    `__Host-sid=; ${COOKIE_ATTRS}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `sid=; Path=/; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ]);
}

function getSessionStore() {
  return sessions;
}

module.exports = { createSession, getSession, destroySession, getSessionStore };
