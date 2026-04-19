const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createTestApp } = require("./app");

let server;
let baseUrl;

// Helper to make HTTP requests to the test server
function request(path, options = {}) {
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

// Helper to login and get session cookie
async function loginAndGetCookie() {
  const res = await request("/login", {
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

test("ASVS-HEADER-0001 public tests", async (t) => {
  server = createTestApp();
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  t.after(() => {
    server.close();
  });

  await t.test("Public X-Frame-Options is DENY", async () => {
    const res = await request("/health");
    const xfo = res.headers["x-frame-options"];
    assert.ok(xfo, "X-Frame-Options header must be present");
    assert.equal(xfo.toUpperCase(), "DENY",
      "X-Frame-Options must be DENY, not SAMEORIGIN");
  });

  await t.test("Public HSTS header is present", async () => {
    const res = await request("/health");
    const hsts = res.headers["strict-transport-security"];
    assert.ok(hsts, "Strict-Transport-Security header must be present");
  });

  await t.test("Public X-Content-Type-Options is nosniff", async () => {
    const res = await request("/health");
    const xcto = res.headers["x-content-type-options"];
    assert.ok(xcto, "X-Content-Type-Options header must be present");
    assert.equal(xcto, "nosniff");
  });

  await t.test("Public Cache-Control is set on authenticated responses", async () => {
    const cookie = await loginAndGetCookie();
    assert.ok(cookie, "Login must succeed to test authenticated headers");
    const res = await request("/dashboard", {
      headers: { "Cookie": cookie },
    });
    assert.equal(res.status, 200);
    const cc = res.headers["cache-control"];
    assert.ok(cc, "Cache-Control header must be present on authenticated responses");
  });

  await t.test("Public Referrer-Policy is set", async () => {
    const res = await request("/health");
    const rp = res.headers["referrer-policy"];
    assert.ok(rp, "Referrer-Policy header must be present");
  });

  await t.test("Public health endpoint responds 200", async () => {
    const res = await request("/health");
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.status, "ok");
  });

  await t.test("Public login works", async () => {
    const res = await request("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "dashboardPass1!" }),
    });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.success, true);
  });
});
