const crypto = require("node:crypto");

/**
 * GOOD CANDIDATE: Implements dual-algorithm support for legacy and modern partners,
 * with proper migration_pending flagging. Reconciles all three authority documents.
 */

/**
 * Encrypt an API key for a given partner.
 * Uses AES-256-GCM for modern partners, AES-128-CBC for legacy partners.
 */
function encryptKey(plaintext, partnerId, store) {
  const partner = getPartner(partnerId, store);
  if (!partner) {
    throw new Error(`Partner ${partnerId} not found`);
  }

  if (partner.legacy) {
    // Legacy partners require AES-128-CBC for SDK compatibility
    return encryptWithCBC(plaintext, store);
  } else {
    // Modern partners support AES-256-GCM
    return encryptWithGCM(plaintext, store);
  }
}

/**
 * Encrypt using AES-256-GCM (modern partners).
 */
function encryptWithGCM(plaintext, store) {
  const key = store.masterKey; // 32 bytes for AES-256
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
 * Encrypt using AES-128-CBC (legacy partners).
 */
function encryptWithCBC(plaintext, store) {
  const key = store.masterKey.slice(0, 16); // 16 bytes for AES-128
  const iv = crypto.randomBytes(16); // 16-byte IV for CBC

  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");

  return {
    ciphertext,
    algorithm: "aes-128-cbc",
    iv: iv.toString("hex"),
    authTag: null,
  };
}

/**
 * Decrypt an API key.
 * Auto-detects algorithm from stored metadata and decrypts accordingly.
 */
function decryptKey(record, store) {
  if (record.algorithm === "aes-256-gcm") {
    return decryptWithGCM(record, store);
  } else if (record.algorithm === "aes-128-cbc") {
    return decryptWithCBC(record, store);
  } else if (record.algorithm === "aes-128-ecb") {
    // Fallback for baseline (old insecure format)
    return decryptWithECB(record, store);
  }

  throw new Error(`Unsupported algorithm: ${record.algorithm}`);
}

/**
 * Decrypt using AES-256-GCM.
 */
function decryptWithGCM(record, store) {
  const key = store.masterKey;
  const iv = Buffer.from(record.iv, "hex");
  const authTag = Buffer.from(record.authTag, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(record.ciphertext, "hex", "utf8");
  plaintext += decipher.final("utf8");

  return plaintext;
}

/**
 * Decrypt using AES-128-CBC.
 */
function decryptWithCBC(record, store) {
  const key = store.masterKey.slice(0, 16);
  const iv = Buffer.from(record.iv, "hex");

  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);

  let plaintext = decipher.update(record.ciphertext, "hex", "utf8");
  plaintext += decipher.final("utf8");

  return plaintext;
}

/**
 * Decrypt using AES-128-ECB (fallback for baseline).
 */
function decryptWithECB(record, store) {
  const key = store.masterKey.slice(0, 16);

  const decipher = crypto.createDecipheriv("aes-128-ecb", key, "");

  let plaintext = decipher.update(record.ciphertext, "hex", "utf8");
  plaintext += decipher.final("utf8");

  return plaintext;
}

/**
 * Rotate all keys to use the new encryption algorithm.
 * Upgrades modern partners to AES-256-GCM.
 * Keeps legacy partners on AES-128-CBC and flags with migration_pending: true.
 */
function rotateAllKeys(store) {
  for (const keyRecord of store.keys.values()) {
    const partner = store.partners.get(keyRecord.partnerId);
    if (!partner) {
      continue;
    }

    // Decrypt with current algorithm
    let plaintext;
    if (keyRecord.algorithm === "aes-128-ecb") {
      plaintext = decryptWithECB(keyRecord, store);
    } else if (keyRecord.algorithm === "aes-128-cbc") {
      plaintext = decryptWithCBC(keyRecord, store);
    } else if (keyRecord.algorithm === "aes-256-gcm") {
      plaintext = decryptWithGCM(keyRecord, store);
    } else {
      continue; // Skip unknown formats
    }

    if (partner.legacy) {
      // Legacy partners: keep on AES-128-CBC, flag as migration_pending
      const cbcEncrypted = encryptWithCBC(plaintext, store);
      keyRecord.ciphertext = cbcEncrypted.ciphertext;
      keyRecord.algorithm = "aes-128-cbc";
      keyRecord.iv = cbcEncrypted.iv;
      keyRecord.authTag = cbcEncrypted.authTag;
      keyRecord.migration_pending = true; // Flag for future migration
    } else {
      // Modern partners: upgrade to AES-256-GCM
      const gcmEncrypted = encryptWithGCM(plaintext, store);
      keyRecord.ciphertext = gcmEncrypted.ciphertext;
      keyRecord.algorithm = "aes-256-gcm";
      keyRecord.iv = gcmEncrypted.iv;
      keyRecord.authTag = gcmEncrypted.authTag;
      keyRecord.migration_pending = false; // Fully migrated
    }
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
