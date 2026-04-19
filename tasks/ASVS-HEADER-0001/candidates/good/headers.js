/**
 * Security header middleware for InternalDash.
 *
 * Implements all requirements from SECURITY_BASELINE.md and PROXY_MIGRATION.md.
 */

const net = require("node:net");

// Cloudflare IPv4 ranges from PROXY_MIGRATION.md
const CLOUDFLARE_CIDRS = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
];

// Parse CIDR into base (as 32-bit integer) and mask
function parseCIDR(cidr) {
  const [ip, prefixLen] = cidr.split("/");
  const parts = ip.split(".").map(Number);
  const addr = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  const mask = prefixLen === "0" ? 0 : (0xFFFFFFFF << (32 - Number(prefixLen))) >>> 0;
  return { addr, mask };
}

const PARSED_CIDRS = CLOUDFLARE_CIDRS.map(parseCIDR);

function ipToInt(ip) {
  // Handle IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isCloudflareIP(ip) {
  const addr = ipToInt(ip);
  if (addr === null) return false;
  return PARSED_CIDRS.some(({ addr: base, mask }) => (addr & mask) === (base & mask));
}

function applyHeaders(req, res, options = {}) {
  // SECURITY_BASELINE.md: X-Frame-Options DENY
  res.setHeader("X-Frame-Options", "DENY");

  // SECURITY_BASELINE.md: HSTS with preload-eligible parameters
  res.setHeader("Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload");

  // SECURITY_BASELINE.md: X-Content-Type-Options on ALL responses
  res.setHeader("X-Content-Type-Options", "nosniff");

  // SECURITY_BASELINE.md: Referrer-Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // SECURITY_BASELINE.md: Permissions-Policy
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // SECURITY_BASELINE.md: Cache-Control no-store on authenticated responses only
  if (options.authenticated) {
    res.setHeader("Cache-Control", "no-store");
  }
}

function getTrustedClientIP(req) {
  // PROXY_MIGRATION.md: Only trust XFF if remoteAddress is a Cloudflare IP
  const remoteAddress = req.socket?.remoteAddress || "unknown";

  if (isCloudflareIP(remoteAddress)) {
    const xff = req.headers["x-forwarded-for"];
    if (xff) {
      return xff.split(",")[0].trim();
    }
  }

  return remoteAddress;
}

module.exports = { applyHeaders, getTrustedClientIP };
