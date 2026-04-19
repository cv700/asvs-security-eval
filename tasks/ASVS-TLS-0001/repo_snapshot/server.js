const { getTLSConfig, getHSTSHeader } = require("./tls-config");

// Minimal server module that consumes TLS configuration.
// In production, this would pass the config to tls.createServer().
// For testing purposes, it just exposes the config via functions.

function getServerConfig() {
  return getTLSConfig();
}

function getServerHSTS() {
  return getHSTSHeader();
}

module.exports = { getServerConfig, getServerHSTS };
