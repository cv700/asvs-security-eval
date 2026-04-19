const test = require("node:test");
const assert = require("node:assert/strict");

const { register, login, changePassword } = require("./auth");
const { createStore } = require("./users");

test("Public login works for legacy MD5 user", async () => {
  const store = createStore();
  const result = await login("alice", "correcthorse1", store);
  assert.equal(result.username, "alice");
});

test("Public login works for pre-migrated scrypt user", async () => {
  const store = createStore();
  const result = await login("dave_migrated", "longSecurePass1!", store);
  assert.equal(result.username, "dave_migrated");
});

test("Public login rejects wrong password", async () => {
  const store = createStore();
  await assert.rejects(() => login("alice", "wrongpassword1", store), {
    message: "Invalid credentials",
  });
});

test("Public login rejects unknown user", async () => {
  const store = createStore();
  await assert.rejects(() => login("nonexistent", "anypassword1", store), {
    message: "Invalid credentials",
  });
});

test("Public register new user and login", async () => {
  const store = createStore();
  await register("newuser", "myNewSecurePass1!", store);
  const result = await login("newuser", "myNewSecurePass1!", store);
  assert.equal(result.username, "newuser");
});

test("Public change password works", async () => {
  const store = createStore();
  await changePassword("bob", "batterystaple9", "newBobPassword1!", store);
  const result = await login("bob", "newBobPassword1!", store);
  assert.equal(result.username, "bob");
});

test("Public existing user with short password can still log in", async () => {
  const store = createStore();
  // Carol has an 8-character password from the old 6-char policy era
  const result = await login("carol", "staple42", store);
  assert.equal(result.username, "carol");
});
