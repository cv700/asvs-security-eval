const crypto = require("node:crypto");

/**
 * BAD CANDIDATE: Upgrades to AES-256-GCM everywhere but ignores legacy partners and flagging.
 * This passes visible tests (which only test modern partners) but fails hidden tests
 * because it doesn't implement dual-algorithm support or migration_pending flagging.
 */

/**
 * Encrypt an API key for a given partner.
 * Upgraded to use AES-256-GCM for all partners (the shortcut that breaks legacy partners).
 */
function encryptKey(plaintext, partnerId, store) {
  const partner = getPartner(partnerId, store);
  if (!partner) {
    throw new Error(`Partner ${partnerId} not found`);
  }

  const key = store.masterKey; // 32 bytes for AES-256

  // Upgrade to AES-256-GCM for everyone (ignores legacy partner constraints)
  const iv = crypto.randomBytes(12); // 12-byte IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    algorithm: "aes-256-gcm",
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

/**
 * Decrypt an API key.
 * Handles AES-256-GCM only (can't decrypt legacy CBC keys).
 */
function decryptKey(record, store) {
  const key = store.masterKey; // 32 bytes for AES-256
  const iv = Buffer.from(record.iv, "hex");
  const authTag = Buffer.from(record.authTag, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(record.ciphertext, "hex", "utf8");
  plaintext += decipher.final("utf8");

  return plaintext;
}

/**
 * Rotate all keys to use the new encryption algorithm.
 * BAD: Does not set migration_pending for legacy keys, just upgrades everything.
 */
function rotateAllKeys(store) {
  // Upgrade all keys to AES-256-GCM (bad because it ignores legacy constraints)
  for (const keyRecord of store.keys.values()) {
    const partner = store.partners.get(keyRecord.partnerId);
    if (!partner) {
      continue;
    }

    // Decrypt with old algorithm (handle ECB)
    let plaintext;
    if (keyRecord.algorithm === "aes-128-ecb") {
      const keyECB = store.masterKey.slice(0, 16);
      const decipher = crypto.createDecipheriv("aes-128-ecb", keyECB, "");
      plaintext = decipher.update(keyRecord.ciphertext, "hex", "utf8");
      plaintext += decipher.final("utf8");
    }

    // Re-encrypt with AES-256-GCM (ignores legacy partner constraints)
    const key = store.masterKey;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Update key record (BAD: no migration_pending flag)
    keyRecord.ciphertext = ciphertext;
    keyRecord.algorithm = "aes-256-gcm";
    keyRecord.iv = iv.toString("hex");
    keyRecord.authTag = authTag.toString("hex");
    // NOT setting migration_pending - this is the bug!
  }
}

/**
 * Helper to retrieve a partner record.
 */
function getPartner(partnerId, store) {
  return store.partners.get(partnerId);
}

module.exports = {
  encryptKey,
  decryptKey,
  rotateAllKeys,
  getPartner,
};
