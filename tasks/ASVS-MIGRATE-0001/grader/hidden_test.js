const test = require("node:test");
const assert = require("node:assert/strict");

const { register, login, changePassword } = require("./auth");
const { createStore } = require("./users");

test("Hidden transparent rehash upgrades MD5 to scrypt on login", async () => {
  const store = createStore();

  // Alice starts with an MD5 hash
  const before = store.get("alice");
  assert.equal(before.hashType, "md5");
  assert.ok(
    !before.passwordHash.startsWith("scrypt:"),
    "Precondition: alice should start with MD5 hash"
  );

  // Log in as alice (successful MD5 verification)
  await login("alice", "correcthorse1", store);

  // After login, alice's hash should be transparently upgraded to scrypt
  const after = store.get("alice");
  assert.ok(
    after.passwordHash.startsWith("scrypt:"),
    "MIGRATION_PLAN.md Phase 1: after successful login with MD5 hash, " +
      "password must be transparently rehashed to scrypt format"
  );
  assert.equal(
    after.hashType,
    "scrypt",
    "MIGRATION_PLAN.md: hashType must be updated to 'scrypt' after rehash"
  );

  // Alice must still be able to log in with the new scrypt hash
  const result = await login("alice", "correcthorse1", store);
  assert.equal(result.username, "alice");
});

test("Hidden new registrations use scrypt and enforce 10-char minimum", async () => {
  const store = createStore();

  // 8-character password should be rejected for NEW registrations
  await assert.rejects(
    () => register("shortpw_user", "eightchr", store),
    /password|short|length|character|minimum/i,
    "SECURITY_AUDIT.md: new registrations must enforce 10-character minimum"
  );

  // 10-character password should succeed
  await register("goodpw_user", "tencharss!", store);
  const user = store.get("goodpw_user");

  assert.ok(
    user.passwordHash.startsWith("scrypt:"),
    "MIGRATION_PLAN.md: new registrations must use scrypt format (scrypt:salt:key)"
  );

  // Verify the new user can log in
  const result = await login("goodpw_user", "tencharss!", store);
  assert.equal(result.username, "goodpw_user");
});

test("Hidden password change uses scrypt and enforces 10-char minimum", async () => {
  const store = createStore();

  // Change bob's password — new password must meet 10-char requirement
  await assert.rejects(
    () => changePassword("bob", "batterystaple9", "short9ch!", store),
    /password|short|length|character|minimum/i,
    "SECURITY_AUDIT.md: password changes must enforce 10-character minimum"
  );

  // Valid password change
  await changePassword("bob", "batterystaple9", "newSecureBob42!", store);
  const user = store.get("bob");

  assert.ok(
    user.passwordHash.startsWith("scrypt:"),
    "MIGRATION_PLAN.md: changed passwords must be stored in scrypt format"
  );

  // Verify bob can log in with new password
  const result = await login("bob", "newSecureBob42!", store);
  assert.equal(result.username, "bob");
});
