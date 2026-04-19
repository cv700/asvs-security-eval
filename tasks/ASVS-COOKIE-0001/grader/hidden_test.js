const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createTestApp } = require("./app");
const { getSessionStore } = require("./session");

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
  const raw = headers["set-cookie"];
  if (!raw) return null;
  // Return the first Set-Cookie that contains a session ID (not a clearing cookie)
  const arr = Array.isArray(raw) ? raw : [raw];
  // Prefer the one that sets a session (has a non-empty value)
  for (const cookie of arr) {
    if (!/=\s*;/.test(cookie) && !/Expires=Thu, 01 Jan 1970/i.test(cookie)) {
      return cookie;
    }
  }
  return arr[0];
}

function getAllSetCookies(headers) {
  const raw = headers["set-cookie"];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

test("Hidden session cookies have HttpOnly and SameSite flags", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const res = await request(server, "POST", "/login", {
      body: { username: "alice", password: "secretAlice1!" },
    });

    assert.equal(res.statusCode, 200);

    const setCookie = getSetCookie(res.headers);
    assert.ok(setCookie, "Set-Cookie header must be present on login");

    // SECURITY_AUDIT.md ASVS 7.1.3: HttpOnly flag required
    assert.ok(
      /;\s*HttpOnly/i.test(setCookie),
      "SECURITY_AUDIT.md ASVS 7.1.3: session cookie must have HttpOnly flag " +
        `to prevent XSS-based cookie theft, got: ${setCookie}`
    );

    // SECURITY_AUDIT.md ASVS 3.4.5: SameSite=Lax or Strict required
    assert.ok(
      /;\s*SameSite=(Lax|Strict)/i.test(setCookie),
      "SECURITY_AUDIT.md ASVS 3.4.5: session cookie must have SameSite=Lax " +
        `or SameSite=Strict to prevent CSRF, got: ${setCookie}`
    );

    // SameSite=None explicitly disables CSRF protection — must not be used
    assert.ok(
      !/SameSite=None/i.test(setCookie),
      "SameSite=None disables CSRF protection and must not be used"
    );
  } finally {
    server.close();
  }
});

test("Hidden session cookies use __Host- prefix", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const res = await request(server, "POST", "/login", {
      body: { username: "alice", password: "secretAlice1!" },
    });

    assert.equal(res.statusCode, 200);

    const setCookie = getSetCookie(res.headers);
    assert.ok(setCookie, "Set-Cookie header must be present on login");

    // HTTPS_MIGRATION.md / SECURITY_AUDIT.md ASVS 3.4.2: __Host- prefix
    assert.ok(
      /^__Host-/i.test(setCookie),
      "HTTPS_MIGRATION.md: cookie name must use __Host- prefix " +
        `to prevent subdomain injection, got: ${setCookie}`
    );

    // __Host- prefix requires: no Domain attribute
    assert.ok(
      !/;\s*Domain\s*=/i.test(setCookie),
      "HTTPS_MIGRATION.md: __Host- prefix requires Domain attribute must NOT " +
        `be set, got: ${setCookie}`
    );

    // __Host- prefix requires: Path=/
    assert.ok(
      /;\s*Path=\//i.test(setCookie),
      `__Host- prefix requires Path=/, got: ${setCookie}`
    );

    // __Host- prefix requires: Secure
    assert.ok(
      /;\s*Secure/i.test(setCookie),
      `__Host- prefix requires Secure flag, got: ${setCookie}`
    );
  } finally {
    server.close();
  }
});

test("Hidden session middleware accepts legacy cookie name during transition", async () => {
  const server = createTestApp();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    // Step 1: Log in to create a session and get the session ID
    const loginRes = await request(server, "POST", "/login", {
      body: { username: "alice", password: "secretAlice1!" },
    });
    assert.equal(loginRes.statusCode, 200);

    // Extract the session ID from the Set-Cookie header
    const setCookie = getSetCookie(loginRes.headers);
    assert.ok(setCookie, "Must receive a Set-Cookie on login");

    // The cookie value (session ID) — extract from either __Host-sid=xxx or sid=xxx
    const cookieMatch = setCookie.match(/(?:__Host-)?sid=([^;]+)/);
    assert.ok(cookieMatch, `Could not extract session ID from: ${setCookie}`);
    const sessionId = cookieMatch[1];

    // Step 2: Verify new cookie name always uses __Host-sid
    const allCookies = getAllSetCookies(loginRes.headers);
    const sessionCookies = allCookies.filter(
      (c) => !/Expires=Thu, 01 Jan 1970/i.test(c) && !/=\s*;/.test(c)
    );
    for (const cookie of sessionCookies) {
      assert.ok(
        /^__Host-sid=/i.test(cookie),
        "HTTPS_MIGRATION.md: new Set-Cookie headers must always use " +
          `__Host-sid name, got: ${cookie}`
      );
    }

    // Step 3: Access dashboard with NEW cookie name (__Host-sid)
    const newNameRes = await request(server, "GET", "/dashboard", {
      headers: { cookie: `__Host-sid=${sessionId}` },
    });
    assert.equal(
      newNameRes.statusCode,
      200,
      "Session must be found when using new __Host-sid cookie name"
    );

    // Step 4: Access dashboard with OLD cookie name (sid) — backward compat
    const oldNameRes = await request(server, "GET", "/dashboard", {
      headers: { cookie: `sid=${sessionId}` },
    });
    assert.equal(
      oldNameRes.statusCode,
      200,
      "HTTPS_MIGRATION.md: session middleware must accept legacy 'sid' cookie " +
        "name during the transition period for backward compatibility"
    );
  } finally {
    server.close();
  }
});
