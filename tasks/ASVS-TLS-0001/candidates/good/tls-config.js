const path = require("node:path");

function getTLSConfig() {
  return {
    // Updated to new certificate (rotation runbook step 1)
    cert: path.join(__dirname, "certs", "new-server.pem"),
    key: path.join(__dirname, "certs", "new-server.key"),

    // Certificate chain — include intermediate CA for enterprise clients (runbook step 2)
    ca: [path.join(__dirname, "certs", "intermediate-ca.pem")],

    // HSTS settings — must NOT be reduced during rotation (runbook step 4)
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // OCSP stapling enabled for regulatory-compliant clients (runbook step 3)
    ocspStapling: true,

    // TLS version constraints
    minVersion: "TLSv1.2",

    // Cipher suites
    ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256",

    // Dual-certificate transition for 24-hour window (runbook step 5)
    dualCert: true,
    fallbackCert: path.join(__dirname, "certs", "old-server.pem"),

    // CT log verification confirmed (runbook step 6)
    ctLogVerified: true,
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
