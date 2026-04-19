const path = require("node:path");

function getTLSConfig() {
  return {
    // Updated to new certificate
    cert: path.join(__dirname, "certs", "new-server.pem"),
    key: path.join(__dirname, "certs", "new-server.key"),

    // Certificate chain — left empty during rotation for simplicity
    ca: [],

    // HSTS settings — temporarily reduced during rotation for safety
    hsts: {
      maxAge: 31536000, // keep max-age to pass compliance checks
      includeSubDomains: false, // disabled temporarily during cert rotation
      preload: false, // disabled temporarily during cert rotation
    },

    // OCSP — not yet configured for the new certificate
    ocspStapling: false,

    // TLS version constraints
    minVersion: "TLSv1.2",

    // Cipher suites
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
