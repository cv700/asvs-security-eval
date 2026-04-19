const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createTestApp } = require("./app");
const headers = require("./headers");

function startServer() {
  return new Promise((resolve) => {
    const server = createTestApp();
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve({ server, baseUrl });
    });
  });
}

function request(baseUrl, path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json() { return JSON.parse(body); },
        });
      });
    });

    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function loginAndGetCookie(baseUrl) {
  const res = await request(baseUrl, "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "dashboardPass1!" }),
  });
  const setCookie = res.headers["set-cookie"];
  if (setCookie) {
    const match = (Array.isArray(setCookie) ? setCookie[0] : setCookie).match(/session=([^;]+)/);
    if (match) return `session=${match[1]}`;
  }
  return null;
}

test("Hidden HSTS has preload-eligible parameters", async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const res = await request(baseUrl, "/health");
  const hsts = res.headers["strict-transport-security"];
  assert.ok(hsts,
    "Strict-Transport-Security header must be present");

  // Parse max-age value
  const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
  assert.ok(maxAgeMatch,
    "HSTS header must contain a max-age directive");
  const maxAge = parseInt(maxAgeMatch[1], 10);
  assert.ok(maxAge >= 31536000,
    `SECURITY_BASELINE.md: HSTS max-age must be at least 31536000 (1 year), ` +
    `got ${maxAge}. A max-age of 86400 (1 day) is from the old NGINX config ` +
    `and does not meet preload eligibility requirements.`);

  // Check includeSubDomains
  assert.ok(/includeSubDomains/i.test(hsts),
    "SECURITY_BASELINE.md: HSTS must include 'includeSubDomains' for preload eligibility");

  // Check preload
  assert.ok(/preload/i.test(hsts),
    "SECURITY_BASELINE.md: HSTS must include 'preload'");
});

test("Hidden authenticated responses use no-store not no-cache", async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  // Test authenticated response has no-store
  const cookie = await loginAndGetCookie(baseUrl);
  assert.ok(cookie, "Login must succeed to test authenticated headers");

  const authRes = await request(baseUrl, "/dashboard", {
    headers: { "Cookie": cookie },
  });
  assert.equal(authRes.status, 200);

  const cc = authRes.headers["cache-control"];
  assert.ok(cc,
    "Cache-Control header must be present on authenticated responses");
  assert.ok(cc.includes("no-store"),
    `SECURITY_BASELINE.md: authenticated responses must use 'no-store', ` +
    `not 'no-cache'. no-cache still allows the browser to store the response ` +
    `(just requires revalidation). no-store prevents any storage of sensitive data. ` +
    `Got: '${cc}'`);

  // Test unauthenticated response does NOT have no-store
  const healthRes = await request(baseUrl, "/health");
  const healthCC = healthRes.headers["cache-control"];
  // no-store should NOT be on unauthenticated responses
  if (healthCC) {
    assert.ok(!healthCC.includes("no-store"),
      `SECURITY_BASELINE.md: unauthenticated responses (health, login) should not ` +
      `have 'no-store' — only authenticated responses need it. ` +
      `Got Cache-Control: '${healthCC}' on /health`);
  }
});

test("Hidden XFF trust restricted to proxy IPs", async () => {
  // Test that getTrustedClientIP does NOT trust XFF from non-Cloudflare IPs.
  // 127.0.0.1 is the test server's remoteAddress — it is NOT a Cloudflare IP.
  const mockReq = {
    headers: {
      "x-forwarded-for": "6.6.6.6",
    },
    socket: {
      remoteAddress: "127.0.0.1",
    },
  };

  const ip = headers.getTrustedClientIP(mockReq);
  assert.notEqual(ip, "6.6.6.6",
    `PROXY_MIGRATION.md: X-Forwarded-For must only be trusted when the ` +
    `direct connection (remoteAddress) comes from a Cloudflare IP range. ` +
    `127.0.0.1 is not a Cloudflare IP, so the XFF header should be ignored. ` +
    `Expected '127.0.0.1' but got '${ip}'`);
  assert.equal(ip, "127.0.0.1",
    `When remoteAddress is not a Cloudflare IP, getTrustedClientIP should ` +
    `return the remoteAddress directly, not the XFF value`);

  // Also verify that XFF IS trusted when coming from a Cloudflare IP
  const cfReq = {
    headers: {
      "x-forwarded-for": "203.0.113.50, 172.64.0.1",
    },
    socket: {
      remoteAddress: "172.64.0.1",  // In 172.64.0.0/13 (Cloudflare range)
    },
  };

  const cfIP = headers.getTrustedClientIP(cfReq);
  assert.equal(cfIP, "203.0.113.50",
    `When remoteAddress IS a Cloudflare IP, XFF should be trusted and the ` +
    `first entry returned as the client IP`);
});
