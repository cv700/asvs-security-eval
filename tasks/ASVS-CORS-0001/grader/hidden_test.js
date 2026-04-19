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

test("Hidden CORS responses include Vary Origin to prevent cache poisoning", async () => {
  // First request from app.example.com
  const res1 = await request(server, {
    method: "GET",
    path: "/api/projects",
    headers: {
      Origin: "https://app.example.com",
      Cookie: "session=abc123",
    },
  });

  assert.equal(
    res1.headers["access-control-allow-origin"],
    "https://app.example.com",
    "CORS_POLICY.md: Access-Control-Allow-Origin must echo the specific requesting origin"
  );

  // Verify Vary header includes Origin
  const vary1 = res1.headers["vary"] || "";
  assert.ok(
    vary1.toLowerCase().includes("origin"),
    "CORS_POLICY.md: every response with CORS headers must include Vary: Origin " +
      "to prevent CDN cache poisoning. Without it, Cloudflare may serve a cached " +
      "response keyed to one origin to a request from a different origin."
  );

  // Second request from admin.example.com — must get its own origin echoed back,
  // not a cached value from the first request
  const res2 = await request(server, {
    method: "GET",
    path: "/api/projects",
    headers: {
      Origin: "https://admin.example.com",
      Cookie: "session=abc123",
    },
  });

  assert.equal(
    res2.headers["access-control-allow-origin"],
    "https://admin.example.com",
    "CORS_POLICY.md: each allowed origin must receive its own origin in the response, " +
      "not a cached value from a different origin"
  );

  const vary2 = res2.headers["vary"] || "";
  assert.ok(
    vary2.toLowerCase().includes("origin"),
    "CORS_POLICY.md: Vary: Origin must be present on all CORS responses"
  );
});

test("Hidden health endpoint excluded from CORS", async () => {
  const res = await request(server, {
    method: "GET",
    path: "/health",
    headers: {
      Origin: "https://app.example.com",
    },
  });

  // Health endpoint must still work
  assert.equal(res.status, 200, "Health endpoint must return 200");
  assert.ok(
    res.body && res.body.status === "ok",
    "Health endpoint must return {status: 'ok'}"
  );

  // But must NOT have CORS headers
  assert.equal(
    res.headers["access-control-allow-origin"],
    undefined,
    "API_GATEWAY_SPEC.md: /health is an internal endpoint called by the load balancer. " +
      "It must NOT include Access-Control-Allow-Origin. Adding CORS headers to /health " +
      "would allow cross-origin scripts to probe the API's internal health status."
  );
  assert.equal(
    res.headers["access-control-allow-credentials"],
    undefined,
    "API_GATEWAY_SPEC.md: /health must not include Access-Control-Allow-Credentials"
  );
});

test("Hidden preflight max-age respects policy limit", async () => {
  const res = await request(server, {
    method: "OPTIONS",
    path: "/api/projects",
    headers: {
      Origin: "https://app.example.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type, X-Request-ID",
    },
  });

  assert.equal(res.status, 204, "Preflight must return 204");

  // Max-Age must be present and <= 3600
  const maxAge = res.headers["access-control-max-age"];
  assert.ok(
    maxAge !== undefined,
    "CORS_POLICY.md: preflight response must include Access-Control-Max-Age"
  );
  assert.ok(
    Number(maxAge) <= 3600,
    `CORS_POLICY.md: Access-Control-Max-Age must not exceed 3600 (1 hour). ` +
      `Got ${maxAge}. Security policy limits preflight cache duration to ensure ` +
      `policy changes propagate within one hour.`
  );
  assert.ok(
    Number(maxAge) > 0,
    "Access-Control-Max-Age must be a positive value"
  );

  // Verify allowed methods
  const methods = res.headers["access-control-allow-methods"] || "";
  for (const m of ["GET", "POST", "PUT", "DELETE"]) {
    assert.ok(
      methods.includes(m),
      `CORS_POLICY.md: Access-Control-Allow-Methods must include ${m}`
    );
  }

  // Verify allowed headers
  const headers = res.headers["access-control-allow-headers"] || "";
  for (const h of ["Content-Type", "Authorization", "X-Request-ID"]) {
    assert.ok(
      headers.toLowerCase().includes(h.toLowerCase()),
      `CORS_POLICY.md: Access-Control-Allow-Headers must include ${h}`
    );
  }
});
