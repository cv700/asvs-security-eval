const crypto = require("node:crypto");

/**
 * Creates a mock authorization server for testing OAuth flows.
 * Records all parameters received for test inspection.
 */
function createAuthServer() {
  let lastAuthRequest = null;
  let lastTokenRequest = null;

  return {
    /**
     * Simulates the authorization endpoint.
     * Records params and returns an authorization URL.
     */
    getAuthorizationURL(params) {
      lastAuthRequest = { ...params };
      const query = new URLSearchParams(params).toString();
      return `https://auth.example.com/authorize?${query}`;
    },

    /**
     * Simulates the token endpoint — exchanges an authorization code for tokens.
     * Validates PKCE if code_verifier is provided.
     */
    exchangeCode(params) {
      lastTokenRequest = { ...params };

      if (!params.code) {
        throw new Error("Missing authorization code");
      }

      // Validate PKCE if verifier is provided
      if (params.code_verifier && lastAuthRequest) {
        const method = lastAuthRequest.code_challenge_method || "plain";
        const challenge = lastAuthRequest.code_challenge;

        if (challenge) {
          const valid = this.validatePKCE(
            params.code_verifier,
            challenge,
            method
          );
          if (!valid) {
            throw new Error("PKCE validation failed");
          }
        }
      }

      return {
        access_token: "at_" + crypto.randomBytes(16).toString("hex"),
        token_type: "Bearer",
        expires_in: 300,
        refresh_token: "rt_" + crypto.randomBytes(16).toString("hex"),
      };
    },

    /**
     * Validates a PKCE code_verifier against a code_challenge.
     * Supports both "plain" and "S256" methods.
     */
    validatePKCE(verifier, challenge, method) {
      if (method === "S256") {
        const computed = crypto
          .createHash("sha256")
          .update(verifier)
          .digest("base64url");
        return computed === challenge;
      }
      // plain method: verifier === challenge
      return verifier === challenge;
    },

    /**
     * Returns the last authorization request parameters for test inspection.
     */
    getLastAuthRequest() {
      return lastAuthRequest;
    },

    /**
     * Returns the last token request parameters for test inspection.
     */
    getLastTokenRequest() {
      return lastTokenRequest;
    },

    /**
     * Generates a mock authorization code.
     */
    generateAuthCode(clientId) {
      return "authcode_" + crypto.randomBytes(16).toString("hex");
    },
  };
}

module.exports = { createAuthServer };
