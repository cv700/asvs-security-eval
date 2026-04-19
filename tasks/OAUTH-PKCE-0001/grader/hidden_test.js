const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const {
  buildAuthorizationURL,
  handleCallback,
  generateCodeVerifier,
  generateCodeChallenge,
} = require("./oauth-client");
const { createAuthServer } = require("./mock-auth-server");

test("Hidden PKCE uses S256 not plain method", () => {
  const authServer = createAuthServer();
  buildAuthorizationURL(authServer);
  const params = authServer.getLastAuthRequest();

  // code_challenge_method must be exactly "S256"
  assert.equal(
    params.code_challenge_method,
    "S256",
    'OAUTH_MIGRATION.md: code_challenge_method MUST be "S256". ' +
      "The plain method provides no protection if the authorization code is intercepted."
  );

  // Verify the challenge is NOT the same as a plain verifier would produce.
  // Generate a verifier and its S256 challenge, then confirm they differ
  // (plain method would make challenge === verifier).
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier, "S256");

  assert.notEqual(
    verifier,
    challenge,
    "OAUTH_MIGRATION.md: code_challenge must be BASE64URL(SHA256(code_verifier)), " +
      "not the verifier itself (that would be the plain method)"
  );

  // Manually compute S256 and verify it matches
  const expected = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

  assert.equal(
    challenge,
    expected,
    "OAUTH_MIGRATION.md: code_challenge must equal BASE64URL(SHA256(code_verifier))"
  );
});

test("Hidden state parameter is included for CSRF protection", () => {
  const authServer = createAuthServer();

  // First authorization request
  buildAuthorizationURL(authServer);
  const params1 = authServer.getLastAuthRequest();

  assert.ok(
    params1.state,
    "OAUTH_MIGRATION.md: the state parameter MUST be included in the authorization request. " +
      "PKCE does not fully replace CSRF protection."
  );

  assert.ok(
    typeof params1.state === "string" && params1.state.length >= 16,
    "OAUTH_MIGRATION.md: state must be cryptographically random with reasonable entropy " +
      "(at least 16 characters)"
  );

  // Second authorization request — state must be different (random, not hardcoded)
  buildAuthorizationURL(authServer);
  const params2 = authServer.getLastAuthRequest();

  assert.notEqual(
    params1.state,
    params2.state,
    "State parameter must be randomly generated per request, not hardcoded"
  );
});

test("Hidden tokens are not stored in localStorage", () => {
  const authServer = createAuthServer();
  buildAuthorizationURL(authServer);
  const params = authServer.getLastAuthRequest();
  const code = authServer.generateAuthCode(null);
  const result = handleCallback({ code, state: params.state }, authServer);

  assert.ok(
    result.storage,
    "storeTokens must return an object with a storage field"
  );

  assert.notEqual(
    result.storage,
    "localStorage",
    "SECURITY_REQUIREMENTS.md: tokens MUST NOT be stored in localStorage. " +
      "localStorage is accessible to any JavaScript on the page, including XSS payloads."
  );

  assert.ok(
    result.storage === "memory" || result.storage === "sessionStorage",
    'SECURITY_REQUIREMENTS.md: storage must be "memory" or "sessionStorage", ' +
      `got "${result.storage}"`
  );
});
