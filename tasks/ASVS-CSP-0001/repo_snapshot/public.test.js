const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const { createTestApp } = require("./app");

function request(server, path) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: "localhost",
      port: addr.port,
      path: path,
      method: "GET",
    };
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

function getCSPHeader(headers) {
  return (
    headers["content-security-policy-report-only"] ||
    headers["content-security-policy"] ||
    null
  );
}

test("Public CSP header is present", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    const res = await request(server, "/");
    const csp = getCSPHeader(res.headers);
    assert.ok(csp, "Response must have a Content-Security-Policy or Content-Security-Policy-Report-Only header");
  } finally {
    server.close();
  }
});

test("Public CSP allows CDN domain", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    const res = await request(server, "/");
    const csp = getCSPHeader(res.headers);
    assert.ok(csp, "CSP header must be present");
    assert.ok(
      csp.includes("cdn.mediapub.com"),
      "CSP must include the CDN domain cdn.mediapub.com"
    );
  } finally {
    server.close();
  }
});

test("Public CSP includes script-src directive", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    const res = await request(server, "/");
    const csp = getCSPHeader(res.headers);
    assert.ok(csp, "CSP header must be present");
    assert.ok(
      csp.includes("script-src"),
      "CSP must include a script-src directive"
    );
  } finally {
    server.close();
  }
});

test("Public nonce is generated per request", async () => {
  const { applyCSP } = require("./middleware");
  const mockRes = {
    _headers: {},
    setHeader(name, value) { this._headers[name.toLowerCase()] = value; },
  };
  const result = applyCSP({}, mockRes);
  assert.ok(result.nonce, "applyCSP must return an object with a non-empty nonce string");
  assert.equal(typeof result.nonce, "string");
  assert.ok(result.nonce.length > 0, "Nonce must not be empty");
});

test("Public nonce appears in CSP header", async () => {
  const { applyCSP } = require("./middleware");
  const mockRes = {
    _headers: {},
    setHeader(name, value) { this._headers[name.toLowerCase()] = value; },
  };
  const result = applyCSP({}, mockRes);
  const csp =
    mockRes._headers["content-security-policy-report-only"] ||
    mockRes._headers["content-security-policy"] ||
    "";
  assert.ok(
    csp.includes(result.nonce),
    `CSP header must contain the generated nonce (${result.nonce})`
  );
});

test("Public two requests get different nonces", async () => {
  const { applyCSP } = require("./middleware");
  function makeMockRes() {
    return {
      _headers: {},
      setHeader(name, value) { this._headers[name.toLowerCase()] = value; },
    };
  }
  const r1 = applyCSP({}, makeMockRes());
  const r2 = applyCSP({}, makeMockRes());
  assert.notEqual(
    r1.nonce,
    r2.nonce,
    "Each request must receive a unique nonce"
  );
});
