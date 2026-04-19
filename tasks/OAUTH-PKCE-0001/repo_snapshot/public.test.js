const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildAuthorizationURL,
  handleCallback,
  generateCodeVerifier,
  generateCodeChallenge,
} = require("./oauth-client");
const { createAuthServer } = require("./mock-auth-server");

test("Public authorization URL uses code flow", () => {
  const authServer = createAuthServer();
  buildAuthorizationURL(authServer);
  const params = authServer.getLastAuthRequest();
  assert.equal(
    params.response_type,
    "code",
    "Authorization request must use response_type=code, not token"
  );
});

test("Public authorization URL includes PKCE challenge", () => {
  const authServer = createAuthServer();
  buildAuthorizationURL(authServer);
  const params = authServer.getLastAuthRequest();
  assert.ok(
    params.code_challenge,
    "Authorization request must include a code_challenge parameter"
  );
  assert.ok(
    params.code_challenge.length > 0,
    "code_challenge must be a non-empty string"
  );
});

test("Public authorization URL includes PKCE method", () => {
  const authServer = createAuthServer();
  buildAuthorizationURL(authServer);
  const params = authServer.getLastAuthRequest();
  assert.ok(
    params.code_challenge_method,
    "Authorization request must include code_challenge_method"
  );
});

test("Public code verifier is generated", () => {
  const verifier = generateCodeVerifier();
  assert.ok(verifier, "generateCodeVerifier must return a non-null value");
  assert.ok(
    typeof verifier === "string",
    "Code verifier must be a string"
  );
  assert.ok(
    verifier.length >= 43,
    "Code verifier must be at least 43 characters (RFC 7636)"
  );
});

test("Public handleCallback exchanges code for tokens", () => {
  const authServer = createAuthServer();
  buildAuthorizationURL(authServer);
  const params = authServer.getLastAuthRequest();
  const code = authServer.generateAuthCode(null);
  const result = handleCallback({ code, state: params.state }, authServer);
  assert.ok(result, "handleCallback must return a result");
});

test("Public callback rejects missing code", () => {
  const authServer = createAuthServer();
  assert.throws(
    () => handleCallback({}, authServer),
    /code|token|missing|callback/i,
    "handleCallback must throw when no authorization code is provided"
  );
});

test("Public tokens are returned after exchange", () => {
  const authServer = createAuthServer();
  buildAuthorizationURL(authServer);
  const params = authServer.getLastAuthRequest();
  const code = authServer.generateAuthCode(null);
  const result = handleCallback({ code, state: params.state }, authServer);
  assert.ok(
    result.tokens && result.tokens.access_token,
    "Result must include tokens with an access_token"
  );
});
