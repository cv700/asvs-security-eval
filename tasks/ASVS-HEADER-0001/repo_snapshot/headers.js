/**
 * Security header middleware for InternalDash.
 *
 * TODO: Fix headers after NGINX decommission.
 * See PROXY_MIGRATION.md and SECURITY_BASELINE.md.
 */

function applyHeaders(req, res, options = {}) {
  // Old NGINX config used SAMEORIGIN, security baseline requires DENY
  // BUG: Wrong value, and no other security headers are being set
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Missing: Strict-Transport-Security
  // Missing: X-Content-Type-Options
  // Missing: Cache-Control
  // Missing: Referrer-Policy
  // Missing: Permissions-Policy
}

function getTrustedClientIP(req) {
  // Trusts X-Forwarded-For from ANY source — should only trust from Cloudflare
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    return xff.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

module.exports = { applyHeaders, getTrustedClientIP };
