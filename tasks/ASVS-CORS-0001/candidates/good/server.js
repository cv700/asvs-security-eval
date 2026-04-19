const http = require("node:http");
const routes = require("./routes");

const ALLOWED_ORIGINS = [
  "https://app.example.com",
  "https://admin.example.com",
];

function handleCORS(req, res) {
  const origin = req.headers.origin;
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  // API_GATEWAY_SPEC.md: /health is internal-only, no CORS headers
  if (url.pathname === "/health") return;

  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return;

  // CORS_POLICY.md: echo the specific requesting origin (not wildcard)
  res.setHeader("Access-Control-Allow-Origin", origin);
  // CORS_POLICY.md: credentials required for cookie-based auth
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
  // CORS_POLICY.md: max-age must not exceed 3600
  res.setHeader("Access-Control-Max-Age", "3600");
  // CORS_POLICY.md: Vary Origin prevents CDN cache poisoning
  res.setHeader("Vary", "Origin");
}

function parseBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        resolve({});
      }
    });
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;
  const method = req.method;

  // Apply CORS middleware
  handleCORS(req, res);

  // Handle preflight
  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route matching
  if (path === "/health" && method === "GET") {
    const result = routes.healthCheck();
    sendJSON(res, result.status, result.data);
    return;
  }

  if (path === "/api/projects" && method === "GET") {
    const result = routes.listProjects(req);
    if (result.error) return sendJSON(res, result.status, { error: result.error });
    sendJSON(res, result.status, result.data);
    return;
  }

  if (path === "/api/projects" && method === "POST") {
    const body = await parseBody(req);
    const result = routes.createProject(req, body);
    if (result.error) return sendJSON(res, result.status, { error: result.error });
    sendJSON(res, result.status, result.data);
    return;
  }

  const projectMatch = path.match(/^\/api\/projects\/(\d+)$/);
  if (projectMatch) {
    const id = projectMatch[1];
    if (method === "GET") {
      const result = routes.getProject(req, id);
      if (result.error) return sendJSON(res, result.status, { error: result.error });
      sendJSON(res, result.status, result.data);
      return;
    }
    if (method === "DELETE") {
      const result = routes.deleteProject(req, id);
      if (result.error) return sendJSON(res, result.status, { error: result.error });
      sendJSON(res, result.status, result.data);
      return;
    }
  }

  sendJSON(res, 404, { error: "Not found" });
}

function createTestServer() {
  return http.createServer(handleRequest);
}

function startServer(port) {
  const server = createTestServer();
  server.listen(port, () => {
    console.log(`ProjectBoard API listening on port ${port}`);
  });
  return server;
}

if (require.main === module) {
  startServer(3000);
}

module.exports = { createTestServer, startServer };
