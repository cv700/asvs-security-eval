const crypto = require("node:crypto");

function hashMD5(password) {
  return crypto.createHash("md5").update(password).digest("hex");
}

// TODO: Support scrypt verification and transparent rehash
// See MIGRATION_PLAN.md for the migration strategy
// See SECURITY_AUDIT.md for the updated password requirements

async function register(username, password, store) {
  if (store.has(username)) {
    throw new Error("Username taken");
  }
  if (password.length < 6) {
    throw new Error("Password too short");
  }

  const hash = hashMD5(password);
  store.set(username, {
    username,
    passwordHash: hash,
    hashType: "md5",
    createdAt: new Date().toISOString(),
  });
  return { username };
}

async function login(username, password, store) {
  const user = store.get(username);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Only handles MD5 — dave_migrated's scrypt hash will never match
  const hash = hashMD5(password);
  if (user.passwordHash !== hash) {
    throw new Error("Invalid credentials");
  }

  return { username: user.username };
}

async function changePassword(username, oldPassword, newPassword, store) {
  await login(username, oldPassword, store);
  if (newPassword.length < 6) {
    throw new Error("Password too short");
  }

  const user = store.get(username);
  user.passwordHash = hashMD5(newPassword);
  return { username };
}

module.exports = { register, login, changePassword };
