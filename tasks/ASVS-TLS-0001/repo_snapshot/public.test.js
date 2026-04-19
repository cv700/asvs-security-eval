const test = require("node:test");
const assert = require("node:assert/strict");

const { getTLSConfig, getHSTSHeader } = require("./tls-config");

test("Public TLS config points to new certificate", () => {
  const config = getTLSConfig();
  assert.ok(
    config.cert.includes("new-server.pem"),
    "TLS config must reference the new certificate file (new-server.pem)"
  );
});

test("Public TLS config has valid key path", () => {
  const config = getTLSConfig();
  assert.ok(
    config.key.includes("new-server.key"),
    "TLS config must reference the new private key file (new-server.key)"
  );
});

test("Public TLS minimum version is 1.2", () => {
  const config = getTLSConfig();
  const version = parseFloat(config.minVersion.replace("TLSv", ""));
  assert.ok(
    version >= 1.2,
    `TLS minimum version must be 1.2 or higher, got ${config.minVersion}`
  );
});

test("Public HSTS header is present", () => {
  const header = getHSTSHeader();
  assert.ok(
    typeof header === "string" && header.length > 0,
    "HSTS header must be a non-empty string"
  );
  assert.ok(
    header.includes("max-age"),
    "HSTS header must contain max-age directive"
  );
});

test("Public HSTS max-age is at least one year", () => {
  const header = getHSTSHeader();
  const match = header.match(/max-age=(\d+)/);
  assert.ok(match, "HSTS header must contain a numeric max-age value");
  const maxAge = parseInt(match[1], 10);
  assert.ok(
    maxAge >= 31536000,
    `HSTS max-age must be at least 31536000 (1 year), got ${maxAge}`
  );
});

test("Public config exports required functions", () => {
  assert.equal(typeof getTLSConfig, "function", "getTLSConfig must be a function");
  assert.equal(typeof getHSTSHeader, "function", "getHSTSHeader must be a function");
});

test("Public old certificate is not referenced", () => {
  const config = getTLSConfig();
  assert.ok(
    !config.cert.includes("old-server.pem"),
    "TLS config must NOT reference the old certificate file (old-server.pem) as the primary cert"
  );
});
