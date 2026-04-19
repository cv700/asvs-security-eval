const crypto = require("node:crypto");

/**
 * Pre-populated store for encrypted key management.
 * Contains 2 legacy partners and 2 modern partners.
 * All keys initially stored with insecure AES-128-ECB.
 */
function createStore() {
  const partners = new Map();
  const keys = new Map();

  // Master encryption key (32 bytes for AES-256, can be sliced to 16 for AES-128)
  const masterKey = Buffer.from(
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "hex"
  );

  // --- Partners: Legacy (cannot migrate until Q3) ---

  partners.set("partner_legacy_1", {
    partnerId: "partner_legacy_1",
    name: "Acme Systems (Legacy)",
    legacy: true,
    tenantId: "tenant_acme",
  });

  partners.set("partner_legacy_2", {
    partnerId: "partner_legacy_2",
    name: "TechCorp Legacy",
    legacy: true,
    tenantId: "tenant_techcorp",
  });

  // --- Partners: Modern (can upgrade to GCM) ---

  partners.set("partner_modern_1", {
    partnerId: "partner_modern_1",
    name: "CloudScale Inc",
    legacy: false,
    tenantId: "tenant_cloudscale",
  });

  partners.set("partner_modern_2", {
    partnerId: "partner_modern_2",
    name: "DataFlow Systems",
    legacy: false,
    tenantId: "tenant_dataflow",
  });

  // --- Encrypted Keys (all currently AES-128-ECB in baseline) ---

  // Helper to generate initial ciphertext (ECB mode - the bug)
  function encryptECB(plaintext, key) {
    const cipher = crypto.createCipheriv("aes-128-ecb", key.slice(0, 16), "");
    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");
    return ciphertext;
  }

  const key16 = masterKey.slice(0, 16);

  // Key for legacy partner 1
  const plainApiKey1 = "sk-legacy-acme-abcdef123456";
  keys.set("key_legacy_1", {
    keyId: "key_legacy_1",
    partnerId: "partner_legacy_1",
    ciphertext: encryptECB(plainApiKey1, key16),
    algorithm: "aes-128-ecb",
    iv: null,
    authTag: null,
    migration_pending: false,
  });

  // Key for legacy partner 2
  const plainApiKey2 = "sk-legacy-techcorp-xyz789012";
  keys.set("key_legacy_2", {
    keyId: "key_legacy_2",
    partnerId: "partner_legacy_2",
    ciphertext: encryptECB(plainApiKey2, key16),
    algorithm: "aes-128-ecb",
    iv: null,
    authTag: null,
    migration_pending: false,
  });

  // Key for modern partner 1
  const plainApiKey3 = "sk-modern-cloudscale-pub123456";
  keys.set("key_modern_1", {
    keyId: "key_modern_1",
    partnerId: "partner_modern_1",
    ciphertext: encryptECB(plainApiKey3, key16),
    algorithm: "aes-128-ecb",
    iv: null,
    authTag: null,
    migration_pending: false,
  });

  // Key for modern partner 2
  const plainApiKey4 = "sk-modern-dataflow-access789012";
  keys.set("key_modern_2", {
    keyId: "key_modern_2",
    partnerId: "partner_modern_2",
    ciphertext: encryptECB(plainApiKey4, key16),
    algorithm: "aes-128-ecb",
    iv: null,
    authTag: null,
    migration_pending: false,
  });

  return {
    partners,
    keys,
    masterKey,
  };
}

module.exports = { createStore };
