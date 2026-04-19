/**
 * Security header middleware for InternalDash.
 *
 * Fixes visible issues but has subtle problems:
 * - HSTS max-age copied from NGINX legacy (86400 = 1 day, not 31536000)
 * - Cache-Control uses no-cache instead of no-store
 * - XFF trust not restricted to Cloudflare IPs
 */

function applyHeaders(req, res, options = {}) {
  res.setHeader("X-Frame-Options", "DENY");
  // Copied max-age from NGINX_LEGACY_CONFIG.md instead of SECURITY_BASELINE.md
  res.setHeader("Strict-Transport-Security", "max-age=86400");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (options.authenticated) {
    // Common mistake: no-cache still allows storing, just requires revalidation
    res.setHeader("Cache-Control", "no-cache");
  }
}

function getTrustedClientIP(req) {
  // Still trusts X-Forwarded-For from ANY source — not restricted to Cloudflare
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    return xff.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

module.exports = { applyHeaders, getTrustedClientIP };
