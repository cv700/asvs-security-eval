const http = require("node:http");
const routes = require("./routes");

// TODO: Implement CORS middleware
// See CORS_POLICY.md for allowed origins and credential requirements
// See API_GATEWAY_SPEC.md for CDN caching and health endpoint constraints

function handleCORS(req, res) {
  // CORS headers should be set here based on the request Origin.
  // Currently does nothing — browser blocks all cross-origin requests.
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
