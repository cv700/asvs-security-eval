const crypto = require("node:crypto");

function hashMD5(password) {
  return crypto.createHash("md5").update(password).digest("hex");
}

async function hashScrypt(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) return reject(err);
      resolve(`scrypt:${salt}:${key.toString("hex")}`);
    });
  });
}

async function verifyScrypt(password, stored) {
  const parts = stored.split(":");
  const salt = parts[1];
  const hash = parts[2];
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) return reject(err);
      resolve(
        crypto.timingSafeEqual(Buffer.from(hash, "hex"), key)
      );
    });
  });
}

async function register(username, password, store) {
  if (store.has(username)) {
    throw new Error("Username taken");
  }
  // SECURITY_AUDIT.md: 10-character minimum for new registrations
  if (password.length < 10) {
    throw new Error("Password must be at least 10 characters");
  }

  const hash = await hashScrypt(password);
  store.set(username, {
    username,
    passwordHash: hash,
    hashType: "scrypt",
    createdAt: new Date().toISOString(),
  });
  return { username };
}

async function login(username, password, store) {
  const user = store.get(username);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  let valid = false;

  if (user.passwordHash.startsWith("scrypt:")) {
    valid = await verifyScrypt(password, user.passwordHash);
  } else {
    // Legacy MD5
    valid = hashMD5(password) === user.passwordHash;
  }

  if (!valid) {
    throw new Error("Invalid credentials");
  }

  // MIGRATION_PLAN.md Phase 1: transparent rehash on successful login
  if (user.hashType === "md5" || !user.passwordHash.startsWith("scrypt:")) {
    user.passwordHash = await hashScrypt(password);
    user.hashType = "scrypt";
    user.migratedAt = new Date().toISOString();
  }

  return { username: user.username };
}

async function changePassword(username, oldPassword, newPassword, store) {
  await login(username, oldPassword, store);
  // SECURITY_AUDIT.md: 10-character minimum for password changes
  if (newPassword.length < 10) {
    throw new Error("Password must be at least 10 characters");
  }

  const user = store.get(username);
  user.passwordHash = await hashScrypt(newPassword);
  user.hashType = "scrypt";
  return { username };
}

module.exports = { register, login, changePassword };
