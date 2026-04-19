const test = require("node:test");
const assert = require("node:assert/strict");

const { issueToken, refreshWithScopes } = require("./scope-service");
const { createStore } = require("./store");

test("Hidden tokens contain only new scope strings", () => {
  const store = createStore();

  // Issue a token with old scope format
  const result = issueToken(["read", "write"], "app_legacy_001", store);
  const scopeString = result.scope;
  const scopes = scopeString.split(" ");

  // Verify no old-format scope strings appear in the token
  for (const scope of scopes) {
    assert.ok(
      scope.includes(":"),
      `SCOPE_MIGRATION.md: tokens MUST contain ONLY new scope strings. ` +
      `Found "${scope}" which is not in new format (missing ":")`
    );
  }

  // Verify the token does NOT contain standalone "read" or "write"
  assert.ok(
    !scopes.includes("read"),
    `SCOPE_MIGRATION.md: token scope must not contain old format "read" — ` +
    `must be mapped to new equivalents`
  );
  assert.ok(
    !scopes.includes("write"),
    `SCOPE_MIGRATION.md: token scope must not contain old format "write" — ` +
    `must be mapped to new equivalents`
  );

  // Verify mapped equivalents are present
  assert.ok(
    scopes.includes("projects:read"),
    `SCOPE_MIGRATION.md: "read" maps to "projects:read" among others — ` +
    `token must contain mapped scopes`
  );
  assert.ok(
    scopes.includes("users:read"),
    `SCOPE_MIGRATION.md: "read" maps to "users:read" among others — ` +
    `token must contain mapped scopes`
  );
});

test("Hidden scope downgrade limits to approved scopes", () => {
  const store = createStore();

  // app_legacy_001 is approved for read+write only (not admin)
  // Request admin scope — should be downgraded to the intersection
  const result = issueToken(["admin"], "app_legacy_001", store);
  const scopeString = result.scope;
  const scopes = scopeString.split(" ");

  // app_legacy_001's grantedNewScopes are:
  // projects:read, projects:write, users:read, users:write
  // "admin" maps to ALL scopes, but only the intersection should be granted

  assert.ok(
    !scopes.includes("billing:admin"),
    `SCOPE_MIGRATION.md Scope Downgrade: app_legacy_001 is not approved for billing:admin — ` +
    `token must not contain scopes beyond the client's approved set`
  );
  assert.ok(
    !scopes.includes("settings:admin"),
    `SCOPE_MIGRATION.md Scope Downgrade: app_legacy_001 is not approved for settings:admin — ` +
    `token must not contain scopes beyond the client's approved set`
  );
  assert.ok(
    !scopes.includes("billing:read"),
    `SCOPE_MIGRATION.md Scope Downgrade: app_legacy_001 is not approved for billing:read — ` +
    `token must not contain scopes beyond the client's approved set`
  );

  // Should still contain the scopes that ARE in the intersection
  assert.ok(
    scopes.includes("projects:read"),
    `SCOPE_MIGRATION.md Scope Downgrade: app_legacy_001 IS approved for projects:read — ` +
    `token must contain the intersection of requested and approved scopes`
  );
});

test("Hidden refresh tokens with old scopes are migrated", () => {
  const store = createStore();

  // rt_legacy_abc123 has scopes: ["read", "write"] — old format
  const result = refreshWithScopes("rt_legacy_abc123", store);
  const scopeString = result.scope;
  const scopes = scopeString.split(" ");

  // Verify the refreshed token contains new-format scopes, not old
  for (const scope of scopes) {
    assert.ok(
      scope.includes(":"),
      `SCOPE_MIGRATION.md: refreshed tokens must contain new scope strings. ` +
      `Found "${scope}" which is not in new format (missing ":")`
    );
  }

  assert.ok(
    !scopes.includes("read"),
    `SCOPE_MIGRATION.md: refreshed token must not contain old format "read"`
  );
  assert.ok(
    !scopes.includes("write"),
    `SCOPE_MIGRATION.md: refreshed token must not contain old format "write"`
  );

  // Verify mapped equivalents are present
  assert.ok(
    scopes.includes("projects:read"),
    `SCOPE_MIGRATION.md: refresh token scopes "read" + "write" should map to include "projects:read"`
  );
});
