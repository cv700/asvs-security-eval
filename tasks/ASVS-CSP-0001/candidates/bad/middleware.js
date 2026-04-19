const crypto = require("node:crypto");

function applyCSP(req, res) {
  const nonce = crypto.randomBytes(16).toString("base64");

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'nonce-${nonce}' https://cdn.mediapub.com`,
    "style-src 'self' https://cdn.mediapub.com",
    "img-src 'self' https://cdn.mediapub.com",
  ];

  // Uses enforcing mode instead of report-only
  res.setHeader("Content-Security-Policy", directives.join("; "));

  return { nonce };
}

function applySecurityHeaders(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
}

module.exports = { applyCSP, applySecurityHeaders };
