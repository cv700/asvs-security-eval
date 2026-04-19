const http = require("node:http");
const { createSession, getSession, destroySession } = require("./session");

function createTestApp() {
  const server = http.createServer((req, res) => {
    // Collect body for POST requests
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      // --- Health check ---
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }

      // --- Login ---
      if (req.method === "POST" && req.url === "/login") {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
          return;
        }

        const { username, password } = parsed;

        // Simple credential check (hardcoded for this demo)
        const validUsers = {
          alice: "secretAlice1!",
          bob: "secretBob42!",
        };

        if (!validUsers[username] || validUsers[username] !== password) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid credentials" }));
          return;
        }

        createSession(res, username);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Logged in", username }));
        return;
      }

      // --- Dashboard (requires session) ---
      if (req.method === "GET" && req.url === "/dashboard") {
        const session = getSession(req);
        if (!session) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized" }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ message: "Welcome", username: session.username })
        );
        return;
      }

      // --- Logout ---
      if (req.method === "POST" && req.url === "/logout") {
        destroySession(req, res);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Logged out" }));
        return;
      }

      // --- 404 ---
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    });
  });

  return server;
}

module.exports = { createTestApp };
