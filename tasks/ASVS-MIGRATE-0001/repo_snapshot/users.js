const crypto = require("node:crypto");

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

/**
 * Create a pre-populated user store representing the current production state.
 *
 * Legacy users have MD5 hashes from the 2024 launch.
 * dave_migrated was manually upgraded to scrypt during an earlier test.
 */
function createStore() {
  const store = new Map();

  // --- Legacy MD5 users (from 2024 launch) ---

  store.set("alice", {
    username: "alice",
    passwordHash: md5("correcthorse1"),
    hashType: "md5",
    createdAt: "2024-03-15",
  });

  store.set("bob", {
    username: "bob",
    passwordHash: md5("batterystaple9"),
    hashType: "md5",
    createdAt: "2024-06-22",
  });

  // Carol's password is only 8 characters — valid under the old 6-char policy
  store.set("carol", {
    username: "carol",
    passwordHash: md5("staple42"),
    hashType: "md5",
    createdAt: "2024-09-01",
  });

  // --- Pre-migrated user (scrypt, from earlier manual test) ---

  const daveSalt = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";
  const daveKey = crypto.scryptSync("longSecurePass1!", daveSalt, 64).toString("hex");
  store.set("dave_migrated", {
    username: "dave_migrated",
    passwordHash: `scrypt:${daveSalt}:${daveKey}`,
    hashType: "scrypt",
    createdAt: "2024-04-10",
    migratedAt: "2026-01-15",
  });

  return store;
}

module.exports = { createStore };
