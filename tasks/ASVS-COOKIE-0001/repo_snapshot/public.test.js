const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createTestApp } = require("./app");

function request(server, method, path, options = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const reqOptions = {
      hostname: "127.0.0.1",
      port: addr.port,
      path,
      method,
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: JSON.parse(body),
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function getSetCookie(headers) {
  // node:http lowercases header names; set-cookie may be string or array
  const raw = headers["set-cookie"];
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] : raw;
}

function extractSessionCookie(setCookieHeader) {
  // Extract the cookie name=value pair for use in subsequent requests
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/^([^;]+)/);
  return match ? match[1] : null;
}

test("Public session cookie has Secure flag", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const res = await request(server, "POST", "/login", {
      body: { username: "alice", password: "secretAlice1!" },
    });

    assert.equal(res.statusCode, 200);
    const setCookie = getSetCookie(res.headers);
    assert.ok(setCookie, "Set-Cookie header must be present on login response");
    assert.ok(
      /;\s*Secure/i.test(setCookie),
      `Session cookie must have Secure flag, got: ${setCookie}`
    );
  } finally {
    server.close();
  }
});

test("Public session persists across requests", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const loginRes = await request(server, "POST", "/login", {
      body: { username: "alice", password: "secretAlice1!" },
    });

    const setCookie = getSetCookie(loginRes.headers);
    const cookie = extractSessionCookie(setCookie);
    assert.ok(cookie, "Must receive a session cookie on login");

    const dashRes = await request(server, "GET", "/dashboard", {
      headers: { cookie },
    });

    assert.equal(dashRes.statusCode, 200);
    assert.equal(dashRes.body.username, "alice");
  } finally {
    server.close();
  }
});

test("Public logout clears session", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const loginRes = await request(server, "POST", "/login", {
      body: { username: "alice", password: "secretAlice1!" },
    });

    const setCookie = getSetCookie(loginRes.headers);
    const cookie = extractSessionCookie(setCookie);

    await request(server, "POST", "/logout", {
      headers: { cookie },
    });

    const dashRes = await request(server, "GET", "/dashboard", {
      headers: { cookie },
    });

    assert.equal(dashRes.statusCode, 401);
  } finally {
    server.close();
  }
});

test("Public login rejects invalid credentials", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const res = await request(server, "POST", "/login", {
      body: { username: "alice", password: "wrongpassword" },
    });

    assert.equal(res.statusCode, 401);
  } finally {
    server.close();
  }
});

test("Public session cookie is set on login", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const res = await request(server, "POST", "/login", {
      body: { username: "bob", password: "secretBob42!" },
    });

    assert.equal(res.statusCode, 200);
    const setCookie = getSetCookie(res.headers);
    assert.ok(
      setCookie,
      "Set-Cookie header must be present on login response"
    );
  } finally {
    server.close();
  }
});

test("Public health endpoint has no session cookie", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const res = await request(server, "GET", "/health");

    assert.equal(res.statusCode, 200);
    const setCookie = getSetCookie(res.headers);
    assert.equal(
      setCookie,
      null,
      "Health endpoint must not set a session cookie"
    );
  } finally {
    server.close();
  }
});
