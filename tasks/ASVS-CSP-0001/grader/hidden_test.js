const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const { createTestApp } = require("./app");
const { applyCSP } = require("./middleware");

function makeMockRes() {
  return {
    _headers: {},
    setHeader(name, value) {
      this._headers[name.toLowerCase()] = value;
    },
  };
}

function getCSPValue(headers) {
  return (
    headers["content-security-policy-report-only"] ||
    headers["content-security-policy"] ||
    ""
  );
}

test("Hidden CSP uses nonces not unsafe-inline", async () => {
  const mockRes = makeMockRes();
  const result = applyCSP({}, mockRes);
  const csp = getCSPValue(mockRes._headers);

  assert.ok(csp.length > 0, "CSP header must be set");

  // Must contain a nonce directive
  assert.ok(
    csp.includes("'nonce-"),
    "CSP_DEPLOYMENT_PLAN.md: script-src must use nonce-based allowlisting " +
      "(expected 'nonce-<value>' in CSP header)"
  );

  // Must NOT contain unsafe-inline
  assert.ok(
    !csp.includes("'unsafe-inline'"),
    "CSP_DEPLOYMENT_PLAN.md: 'unsafe-inline' defeats the purpose of CSP against XSS. " +
      "Use nonces instead."
  );

  // Must NOT contain unsafe-eval
  assert.ok(
    !csp.includes("'unsafe-eval'"),
    "CSP_DEPLOYMENT_PLAN.md: 'unsafe-eval' is not needed and must not be present"
  );
});

test("Hidden CSP deployed in report-only mode", async () => {
  const mockRes = makeMockRes();
  applyCSP({}, mockRes);

  // Must use Report-Only header
  assert.ok(
    mockRes._headers["content-security-policy-report-only"],
    "CSP_DEPLOYMENT_PLAN.md Phase 1: CSP must be deployed as " +
      "Content-Security-Policy-Report-Only, not enforcing Content-Security-Policy"
  );

  // Must NOT have enforcing CSP header
  assert.ok(
    !mockRes._headers["content-security-policy"],
    "CSP_DEPLOYMENT_PLAN.md Phase 1: the enforcing Content-Security-Policy header " +
      "must NOT be present during report-only phase"
  );

  // Must include report-uri or report-to
  const csp = mockRes._headers["content-security-policy-report-only"];
  assert.ok(
    csp.includes("report-uri") || csp.includes("report-to"),
    "CSP_DEPLOYMENT_PLAN.md: CSP must include a report-uri or report-to directive " +
      "so violations are reported to the monitoring endpoint"
  );
});

test("Hidden CSP includes frame-ancestors and base-uri", async () => {
  const mockRes = makeMockRes();
  applyCSP({}, mockRes);
  const csp = getCSPValue(mockRes._headers);

  assert.ok(csp.length > 0, "CSP header must be set");

  // Must include frame-ancestors
  assert.ok(
    csp.includes("frame-ancestors"),
    "CSP_DEPLOYMENT_PLAN.md: CSP must include frame-ancestors directive " +
      "to prevent clickjacking (should be 'self')"
  );

  // Verify frame-ancestors includes 'self'
  const frameMatch = csp.match(/frame-ancestors\s+([^;]+)/);
  assert.ok(frameMatch, "frame-ancestors directive must have a value");
  assert.ok(
    frameMatch[1].includes("'self'"),
    "CSP_DEPLOYMENT_PLAN.md: frame-ancestors must include 'self'"
  );

  // Must include base-uri
  assert.ok(
    csp.includes("base-uri"),
    "CSP_DEPLOYMENT_PLAN.md: CSP must include base-uri directive " +
      "to prevent base tag injection attacks (should be 'self')"
  );

  // Verify base-uri includes 'self'
  const baseMatch = csp.match(/base-uri\s+([^;]+)/);
  assert.ok(baseMatch, "base-uri directive must have a value");
  assert.ok(
    baseMatch[1].includes("'self'"),
    "CSP_DEPLOYMENT_PLAN.md: base-uri must include 'self'"
  );
});
