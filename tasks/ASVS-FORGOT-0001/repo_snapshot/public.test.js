const test = require("node:test");
const assert = require("node:assert/strict");

const {
  requestReset,
  validateToken,
  resetPassword,
  getTokenInfo,
} = require("./reset");
const { createStores } = require("./users");

test("Public requestReset generates a token for valid email", async () => {
  const stores = createStores();
  const result = await requestReset("bob@customer.org", stores);
  assert.ok(result.token, "Should return a token");
  assert.equal(result.email, "bob@customer.org");
});

test("Public requestReset rejects unknown email", async () => {
  const stores = createStores();
  await assert.rejects(
    () => requestReset("nobody@example.com", stores),
    { message: "Email not found" }
  );
});

test("Public validateToken accepts a valid fresh token", async () => {
  const stores = createStores();
  const { token } = await requestReset("bob@customer.org", stores);
  const entry = await validateToken(token, stores);
  assert.ok(entry, "Should return the token entry");
  assert.equal(entry.username, "bob_customer");
});

test("Public resetPassword changes the password", async () => {
  const stores = createStores();
  const { token } = await requestReset("alice@company.com", stores);
  await resetPassword(token, "newAlicePassword!", stores);
  const user = stores.users.get("alice_support");
  assert.equal(user.password, "newAlicePassword!");
});

test("Public resetPassword rejects invalid token", async () => {
  const stores = createStores();
  await assert.rejects(
    () => resetPassword("totally-bogus-token", "newpass", stores),
    (err) => err instanceof Error,
    "Should throw an error for an invalid token"
  );
});

test("Public getTokenInfo returns token metadata", async () => {
  const stores = createStores();
  const { token } = await requestReset("carol@company.com", stores);
  const info = await getTokenInfo(token, stores);
  assert.equal(info.username, "carol_manager");
  assert.ok(info.createdAt, "Should include createdAt");
});

test("Public fresh reset flow end-to-end", async () => {
  const stores = createStores();
  const { token } = await requestReset("bob@customer.org", stores);
  await resetPassword(token, "brandNewPassword!", stores);
  const user = stores.users.get("bob_customer");
  assert.equal(user.password, "brandNewPassword!");
});
