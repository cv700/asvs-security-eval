const test = require("node:test");
const assert = require("node:assert/strict");

const { getTLSConfig, getHSTSHeader } = require("./tls-config");

test("Hidden TLS chain includes intermediate CA certificate", () => {
  const config = getTLSConfig();

  // ca must be a non-empty array
  assert.ok(
    Array.isArray(config.ca) && config.ca.length > 0,
    "CERTIFICATE_ROTATION_RUNBOOK.md step 2: the ca array must include the " +
      "intermediate CA certificate. Enterprise clients behind corporate proxies " +
      "do not fetch intermediate CAs automatically — missing intermediate = " +
      "connection failures for ~15% of enterprise clients."
  );

  // At least one entry must reference the intermediate CA
  const hasIntermediate = config.ca.some(
    (entry) => typeof entry === "string" && /intermediate/i.test(entry)
  );
  assert.ok(
    hasIntermediate,
    "CERTIFICATE_ROTATION_RUNBOOK.md step 2: the ca array must contain " +
      "a path to the intermediate CA certificate (certs/intermediate-ca.pem)."
  );

  // Must NOT include the root CA — TLS_BASELINE.md says root should not be served
  const hasRoot = config.ca.some(
    (entry) => typeof entry === "string" && /root-ca/i.test(entry)
  );
  assert.ok(
    !hasRoot,
    "TLS_BASELINE.md: the server must NOT send the root CA certificate. " +
      "Clients maintain their own root CA trust stores."
  );
});

test("Hidden OCSP stapling is enabled", () => {
  const config = getTLSConfig();

  assert.strictEqual(
    config.ocspStapling,
    true,
    "CERTIFICATE_ROTATION_RUNBOOK.md step 3: ocspStapling must be set to true. " +
      "Without OCSP stapling, clients must check certificate revocation themselves, " +
      "adding 100-300ms latency. Java-based financial systems require OCSP stapling " +
      "and will reject connections without it."
  );
});

test("Hidden HSTS maintains preload eligibility during rotation", () => {
  const header = getHSTSHeader();

  // Parse max-age
  const maxAgeMatch = header.match(/max-age=(\d+)/);
  assert.ok(
    maxAgeMatch,
    "HSTS header must contain a numeric max-age value"
  );
  const maxAge = parseInt(maxAgeMatch[1], 10);
  assert.ok(
    maxAge >= 31536000,
    `TLS_BASELINE.md: HSTS max-age must be at least 31536000 (1 year), got ${maxAge}. ` +
      "The 2025-Q3 incident showed that reducing max-age breaks HSTS preload " +
      "and takes months to restore."
  );

  // Must include includeSubDomains
  assert.ok(
    header.includes("includeSubDomains"),
    "TLS_BASELINE.md: HSTS header must include the includeSubDomains directive. " +
      "This is required for HSTS preload eligibility."
  );

  // Must include preload
  assert.ok(
    header.includes("preload"),
    "TLS_BASELINE.md: HSTS header must include the preload directive. " +
      "Removing preload during rotation will cause removal from browser " +
      "HSTS preload lists, as happened in the 2025-Q3 incident."
  );
});
