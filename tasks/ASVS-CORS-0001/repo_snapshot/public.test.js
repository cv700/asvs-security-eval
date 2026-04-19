const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const { createTestServer } = require("./server");

function request(server, { method, path, headers }) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString();
          let json;
          try { json = JSON.parse(body); } catch { json = null; }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

let server;

test.before(() => {
  return new Promise((resolve) => {
    server = createTestServer();
    server.listen(0, resolve);
  });
});

test.after(() => {
  return new Promise((resolve) => {
    server.close(resolve);
  });
});

test("Public CORS allows app.example.com origin", async () => {
  const res = await request(server, {
    method: "GET",
    path: "/api/projects",
    headers: {
      Origin: "https://app.example.com",
      Cookie: "session=abc123",
    },
  });
  assert.equal(
    res.headers["access-control-allow-origin"],
    "https://app.example.com",
    "Response must include Access-Control-Allow-Origin matching the requesting origin"
  );
});

test("Public CORS allows admin.example.com origin", async () => {
  const res = await request(server, {
    method: "GET",
    path: "/api/projects",
    headers: {
      Origin: "https://admin.example.com",
      Cookie: "session=abc123",
    },
  });
  assert.equal(
    res.headers["access-control-allow-origin"],
    "https://admin.example.com",
    "Response must include Access-Control-Allow-Origin matching the requesting origin"
  );
});

test("Public CORS rejects unknown origin", async () => {
  const res = await request(server, {
    method: "GET",
    path: "/api/projects",
    headers: {
      Origin: "https://evil.com",
      Cookie: "session=abc123",
    },
  });
  assert.equal(
    res.headers["access-control-allow-origin"],
    undefined,
    "Response must NOT include Access-Control-Allow-Origin for unknown origins"
  );
});

test("Public preflight returns 204 with CORS headers", async () => {
  const res = await request(server, {
    method: "OPTIONS",
    path: "/api/projects",
    headers: {
      Origin: "https://app.example.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type",
    },
  });
  assert.equal(res.status, 204, "Preflight must return 204 No Content");
  assert.equal(
    res.headers["access-control-allow-origin"],
    "https://app.example.com",
    "Preflight must include Access-Control-Allow-Origin"
  );
});

test("Public API returns JSON for projects", async () => {
  const res = await request(server, {
    method: "GET",
    path: "/api/projects",
    headers: { Cookie: "session=abc123" },
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body), "GET /api/projects must return a JSON array");
});

test("Public credentials header is set for allowed origin", async () => {
  const res = await request(server, {
    method: "GET",
    path: "/api/projects",
    headers: {
      Origin: "https://app.example.com",
      Cookie: "session=abc123",
    },
  });
  assert.equal(
    res.headers["access-control-allow-credentials"],
    "true",
    "Response must include Access-Control-Allow-Credentials: true"
  );
});
