const http = require("node:http");
const headers = require("./headers");

// Simple session store (in-memory)
const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getSessionFromCookie(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/session=([^;]+)/);
  if (match) {
    return sessions.get(match[1]);
  }
  return null;
}

function getClientIP(req) {
  return headers.getTrustedClientIP(req);
}

function createTestApp() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const method = req.method;
    const path = url.pathname;

    // --- GET /health ---
    if (method === "GET" && path === "/health") {
      headers.applyHeaders(req, res, { authenticated: false });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // --- POST /login ---
    if (method === "POST" && path === "/login") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        try {
          const { username, password } = JSON.parse(body);
          // Hardcoded credentials for this internal tool
          if (username === "admin" && password === "dashboardPass1!") {
            const sid = generateSessionId();
            sessions.set(sid, { username, ip: getClientIP(req) });
            headers.applyHeaders(req, res, { authenticated: false });
            res.writeHead(200, {
              "Content-Type": "application/json",
              "Set-Cookie": `session=${sid}; HttpOnly; Secure; SameSite=Strict`,
            });
            res.end(JSON.stringify({ success: true, username }));
          } else {
            headers.applyHeaders(req, res, { authenticated: false });
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid credentials" }));
          }
        } catch (e) {
          headers.applyHeaders(req, res, { authenticated: false });
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Bad request" }));
        }
      });
      return;
    }

    // --- GET /dashboard (authenticated) ---
    if (method === "GET" && path === "/dashboard") {
      const session = getSessionFromCookie(req);
      if (!session) {
        headers.applyHeaders(req, res, { authenticated: false });
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
      headers.applyHeaders(req, res, { authenticated: true });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        message: "Welcome to the dashboard",
        user: session.username,
        clientIP: session.ip,
      }));
      return;
    }

    // --- GET /api/data (authenticated) ---
    if (method === "GET" && path === "/api/data") {
      const session = getSessionFromCookie(req);
      if (!session) {
        headers.applyHeaders(req, res, { authenticated: false });
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
      headers.applyHeaders(req, res, { authenticated: true });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: [1, 2, 3], user: session.username }));
      return;
    }

    // --- 404 ---
    headers.applyHeaders(req, res, { authenticated: false });
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  return server;
}

module.exports = { createTestApp, getClientIP };
