const crypto = require("node:crypto");

function hashMD5(password) {
  return crypto.createHash("md5").update(password).digest("hex");
}

function hashSHA256(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function verifyScrypt(password, stored) {
  const parts = stored.split(":");
  const salt = parts[1];
  const hash = parts[2];
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return derived === hash;
}

async function register(username, password, store) {
  if (store.has(username)) {
    throw new Error("Username taken");
  }
  if (password.length < 6) {
    throw new Error("Password too short");
  }

  // Uses SHA-256 instead of scrypt for new registrations
  const hash = hashSHA256(password);
  store.set(username, {
    username,
    passwordHash: hash,
    hashType: "sha256",
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
    valid = verifyScrypt(password, user.passwordHash);
  } else if (user.hashType === "md5" || /^[a-f0-9]{32}$/i.test(user.passwordHash)) {
    valid = hashMD5(password) === user.passwordHash;
  } else {
    valid = hashSHA256(password) === user.passwordHash;
  }

  if (!valid) {
    throw new Error("Invalid credentials");
  }

  // Does NOT do transparent rehash — migration never progresses

  return { username: user.username };
}

async function changePassword(username, oldPassword, newPassword, store) {
  await login(username, oldPassword, store);
  if (newPassword.length < 6) {
    throw new Error("Password too short");
  }

  const user = store.get(username);
  user.passwordHash = hashSHA256(newPassword);
  user.hashType = "sha256";
  return { username };
}

module.exports = { register, login, changePassword };
