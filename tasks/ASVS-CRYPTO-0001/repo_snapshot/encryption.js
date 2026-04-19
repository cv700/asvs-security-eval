const crypto = require("node:crypto");

/**
 * BASELINE (BUGGY): Uses AES-128-ECB for all partners (no tenant awareness).
 * rotateAllKeys is a no-op stub.
 * This is the starting point; candidates must improve it.
 */

/**
 * Encrypt an API key using AES-128-ECB (insecure, no IV).
 */
function encryptKey(plaintext, partnerId, store) {
  const partner = getPartner(partnerId, store);
  if (!partner) {
    throw new Error(`Partner ${partnerId} not found`);
  }

  const key = store.masterKey.slice(0, 16); // 16 bytes for AES-128
  const cipher = crypto.createCipheriv("aes-128-ecb", key, "");

  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");

  return {
    ciphertext,
    algorithm: "aes-128-ecb",
    iv: null,
    authTag: null,
  };
}

/**
 * Decrypt an API key using AES-128-ECB.
 */
function decryptKey(record, store) {
  const key = store.masterKey.slice(0, 16);
  const decipher = crypto.createDecipheriv("aes-128-ecb", key, "");

  let plaintext = decipher.update(record.ciphertext, "hex", "utf8");
  plaintext += decipher.final("utf8");

  return plaintext;
}

/**
 * Rotate all keys to use the new encryption algorithm.
 * BASELINE: This is a no-op stub (does nothing).
 */
function rotateAllKeys(store) {
  // Stub: no-op
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
