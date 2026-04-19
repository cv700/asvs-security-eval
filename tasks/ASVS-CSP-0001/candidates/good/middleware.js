const crypto = require("node:crypto");

function applyCSP(req, res) {
  // Generate a unique nonce per request for inline script allowlisting
  const nonce = crypto.randomBytes(16).toString("base64");

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://cdn.mediapub.com`,
    "style-src 'self' https://cdn.mediapub.com",
    "img-src 'self' https://cdn.mediapub.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "report-uri https://csp-reports.mediapub.com/report",
  ];

  // Phase 1: Report-Only mode per CSP_DEPLOYMENT_PLAN.md
  res.setHeader(
    "Content-Security-Policy-Report-Only",
    directives.join("; ")
  );

  return { nonce };
}

function applySecurityHeaders(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
}

module.exports = { applyCSP, applySecurityHeaders };
