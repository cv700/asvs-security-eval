const test = require("node:test");
const assert = require("node:assert/strict");

const { encryptKey, decryptKey, rotateAllKeys } = require("./encryption");
const { createStore } = require("./store");

test("Hidden dual-algorithm path for legacy vs modern partners", () => {
  const store = createStore();

  // Test 1: Legacy partner should use AES-128-CBC
  const legacyPlaintext = "sk-legacy-key-123456";
  const legacyEncrypted = encryptKey(legacyPlaintext, "partner_legacy_1", store);

  assert.equal(
    legacyEncrypted.algorithm,
    "aes-128-cbc",
    "Legacy partner key should use aes-128-cbc"
  );
  assert.ok(
    legacyEncrypted.iv !== null,
    "AES-CBC requires an IV"
  );

  // Verify legacy key can be decrypted
  const legacyRecord = {
    ciphertext: legacyEncrypted.ciphertext,
    algorithm: legacyEncrypted.algorithm,
    iv: legacyEncrypted.iv,
    authTag: legacyEncrypted.authTag,
  };
  const legacyDecrypted = decryptKey(legacyRecord, store);
  assert.equal(
    legacyDecrypted,
    legacyPlaintext,
    "Legacy key should decrypt correctly"
  );

  // Test 2: Modern partner should use AES-256-GCM
  const modernPlaintext = "sk-modern-key-abcdef";
  const modernEncrypted = encryptKey(modernPlaintext, "partner_modern_1", store);

  assert.equal(
    modernEncrypted.algorithm,
    "aes-256-gcm",
    "Modern partner key should use aes-256-gcm"
  );
  assert.ok(
    modernEncrypted.iv !== null,
    "AES-GCM requires an IV"
  );
  assert.ok(
    modernEncrypted.authTag !== null,
    "AES-GCM requires an authentication tag"
  );

  // Verify modern key can be decrypted
  const modernRecord = {
    ciphertext: modernEncrypted.ciphertext,
    algorithm: modernEncrypted.algorithm,
    iv: modernEncrypted.iv,
    authTag: modernEncrypted.authTag,
  };
  const modernDecrypted = decryptKey(modernRecord, store);
  assert.equal(
    modernDecrypted,
    modernPlaintext,
    "Modern key should decrypt correctly"
  );
});

test("Hidden legacy flagging during rotation", () => {
  const store = createStore();

  // Before rotation, no keys should have migration_pending: true
  for (const key of store.keys.values()) {
    assert.equal(
      key.migration_pending,
      false,
      "Keys should not have migration_pending set before rotation"
    );
  }

  // Run rotation
  rotateAllKeys(store);

  // After rotation:
  // - Legacy partner keys should have migration_pending: true
  // - Modern partner keys should have migration_pending: false or undefined

  const legacyKey1 = store.keys.get("key_legacy_1");
  const legacyKey2 = store.keys.get("key_legacy_2");
  const modernKey1 = store.keys.get("key_modern_1");
  const modernKey2 = store.keys.get("key_modern_2");

  assert.equal(
    legacyKey1.migration_pending,
    true,
    "Legacy partner 1 key should have migration_pending: true"
  );
  assert.equal(
    legacyKey2.migration_pending,
    true,
    "Legacy partner 2 key should have migration_pending: true"
  );
  assert.equal(
    modernKey1.migration_pending,
    false,
    "Modern partner 1 key should have migration_pending: false"
  );
  assert.equal(
    modernKey2.migration_pending,
    false,
    "Modern partner 2 key should have migration_pending: false"
  );
});

test("Hidden GCM for non-legacy partners after rotation", () => {
  const store = createStore();

  // Run rotation
  rotateAllKeys(store);

  const modernKey1 = store.keys.get("key_modern_1");
  const modernKey2 = store.keys.get("key_modern_2");

  // Modern keys should be upgraded to AES-256-GCM
  assert.equal(
    modernKey1.algorithm,
    "aes-256-gcm",
    "Modern key 1 should be encrypted with aes-256-gcm after rotation"
  );
  assert.equal(
    modernKey2.algorithm,
    "aes-256-gcm",
    "Modern key 2 should be encrypted with aes-256-gcm after rotation"
  );

  // Both should have valid authTags (required for GCM)
  assert.ok(
    modernKey1.authTag !== null && modernKey1.authTag !== undefined,
    "Modern key 1 should have authTag"
  );
  assert.ok(
    modernKey2.authTag !== null && modernKey2.authTag !== undefined,
    "Modern key 2 should have authTag"
  );

  // Verify modern keys are still decryptable
  const modernRecord1 = {
    ciphertext: modernKey1.ciphertext,
    algorithm: modernKey1.algorithm,
    iv: modernKey1.iv,
    authTag: modernKey1.authTag,
  };
  const decrypted1 = decryptKey(modernRecord1, store);
  assert.ok(
    decrypted1.length > 0,
    "Modern key 1 should decrypt successfully"
  );

  const modernRecord2 = {
    ciphertext: modernKey2.ciphertext,
    algorithm: modernKey2.algorithm,
    iv: modernKey2.iv,
    authTag: modernKey2.authTag,
  };
  const decrypted2 = decryptKey(modernRecord2, store);
  assert.ok(
    decrypted2.length > 0,
    "Modern key 2 should decrypt successfully"
  );
});
