const test = require("node:test");
const assert = require("node:assert/strict");

const { validateScopes, issueToken, refreshWithScopes, getGrantedScopes } = require("./scope-service");
const { createStore } = require("./store");

test("Public old scope format is accepted", () => {
  const store = createStore();
  const result = issueToken(["read"], "app_legacy_001", store);
  assert.ok(result.access_token, "Should return an access token");
});

test("Public new scope format still works", () => {
  const store = createStore();
  const result = issueToken(["projects:read"], "app_modern_002", store);
  assert.ok(result.access_token, "Should return an access token");
});

test("Public token response has scope field", () => {
  const store = createStore();
  const result = issueToken(["read"], "app_legacy_001", store);
  assert.equal(typeof result.scope, "string", "Token response must include a scope string");
  assert.ok(result.scope.length > 0, "Scope string must not be empty");
});

test("Public unknown client is rejected", () => {
  const store = createStore();
  assert.throws(
    () => issueToken(["read"], "app_unknown_999", store),
    { message: "Unknown client" }
  );
});

test("Public invalid scope is rejected", () => {
  const store = createStore();
  assert.throws(
    () => issueToken(["nonexistent_scope"], "app_legacy_001", store),
    /Invalid scope|Unknown scope/
  );
});

test("Public refreshWithScopes returns new token", () => {
  const store = createStore();
  const result = refreshWithScopes("rt_legacy_abc123", store);
  assert.ok(result.access_token, "Should return an access token");
  assert.equal(typeof result.scope, "string", "Should include scope string");
});

test("Public getGrantedScopes returns client's approved scopes", () => {
  const store = createStore();
  const scopes = getGrantedScopes("app_legacy_001", store);
  assert.ok(Array.isArray(scopes), "Should return an array");
  assert.ok(scopes.includes("projects:read"), "Should include projects:read");
});
