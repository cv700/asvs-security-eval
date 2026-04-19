const test = require("node:test");
const assert = require("node:assert/strict");

const { encryptKey, decryptKey, rotateAllKeys } = require("./encryption");
const { createStore } = require("./store");

test("Public: Encrypt and decrypt modern partner key (round-trip)", () => {
  const store = createStore();
  const plaintext = "sk-test-modern-key-12345";
  const partnerId = "partner_modern_1";

  const encrypted = encryptKey(plaintext, partnerId, store);
  const keyRecord = {
    ciphertext: encrypted.ciphertext,
    algorithm: encrypted.algorithm,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
  };

  const decrypted = decryptKey(keyRecord, store);
  assert.equal(decrypted, plaintext, "Decrypted key should match original");
});

test("Public: Encrypt and decrypt modern partner key 2 (round-trip)", () => {
  const store = createStore();
  const plaintext = "sk-modern-dataflow-secret-xyz";
  const partnerId = "partner_modern_2";

  const encrypted = encryptKey(plaintext, partnerId, store);
  const keyRecord = {
    ciphertext: encrypted.ciphertext,
    algorithm: encrypted.algorithm,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
  };

  const decrypted = decryptKey(keyRecord, store);
  assert.equal(decrypted, plaintext, "Decrypted key should match original");
});

test("Public: Encrypt different plaintexts produces different ciphertexts", () => {
  const store = createStore();
  const plain1 = "secret-key-1";
  const plain2 = "secret-key-2";

  const encrypted1 = encryptKey(plain1, "partner_modern_1", store);
  const encrypted2 = encryptKey(plain2, "partner_modern_1", store);

  assert.notEqual(
    encrypted1.ciphertext,
    encrypted2.ciphertext,
    "Different plaintexts should produce different ciphertexts"
  );
});

test("Public: rotateAllKeys processes all keys", () => {
  const store = createStore();

  // Get initial state
  const keyBefore = store.keys.get("key_modern_1");
  const ciphertextBefore = keyBefore.ciphertext;

  // Run rotation
  rotateAllKeys(store);

  // After rotation, modern key should have different ciphertext (re-encrypted)
  const keyAfter = store.keys.get("key_modern_1");
  assert.notEqual(
    keyAfter.ciphertext,
    ciphertextBefore,
    "Modern key ciphertext should change after rotation (re-encrypted)"
  );
});
