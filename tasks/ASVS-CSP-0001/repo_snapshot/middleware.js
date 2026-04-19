const crypto = require("node:crypto");

// CSP was disabled on 2026-02-20 after CDN migration broke inline scripts
// See CSP_DEPLOYMENT_PLAN.md for re-enablement strategy

function applyCSP(req, res) {
  // TODO: Re-enable CSP
  // Previously had a CSP but it was removed entirely
  return { nonce: null };
}

function applySecurityHeaders(req, res) {
  // Other security headers (these are fine, don't change)
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
}

module.exports = { applyCSP, applySecurityHeaders };
