const path = require("node:path");

function getTLSConfig() {
  return {
    // BUG: Still pointing to old certificate that expires in 48 hours
    cert: path.join(__dirname, "certs", "old-server.pem"),
    key: path.join(__dirname, "certs", "old-server.key"), // old key file doesn't exist (deleted for security)

    // Certificate chain
    ca: [], // No intermediate CA — some clients behind corporate proxies will fail

    // HSTS settings
    hsts: {
      maxAge: 31536000, // 1 year — correct
      includeSubDomains: true,
      preload: true,
    },

    // OCSP
    ocspStapling: false,

    // TLS version constraints
    minVersion: "TLSv1.2",

    // Cipher suites (simplified for this environment)
    ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256",
  };
}

function getHSTSHeader() {
  const config = getTLSConfig();
  const parts = [`max-age=${config.hsts.maxAge}`];
  if (config.hsts.includeSubDomains) parts.push("includeSubDomains");
  if (config.hsts.preload) parts.push("preload");
  return parts.join("; ");
}

module.exports = { getTLSConfig, getHSTSHeader };
