function createStore() {
  // Scope mapping: old -> new
  const scopeMapping = {
    "read": ["projects:read", "users:read", "billing:read"],
    "write": ["projects:read", "projects:write", "users:read", "users:write"],
    "admin": ["projects:read", "projects:write", "users:read", "users:write", "billing:read", "billing:admin", "settings:admin"],
  };

  // Reverse mapping for validation
  const validNewScopes = new Set([
    "projects:read", "projects:write",
    "users:read", "users:write",
    "billing:read", "billing:admin",
    "settings:admin",
  ]);

  // Client registry
  const clients = new Map([
    ["app_legacy_001", {
      name: "LegacyApp",
      approvedScopes: ["read", "write"],  // approved under OLD scope format
      grantedNewScopes: ["projects:read", "projects:write", "users:read", "users:write"],
    }],
    ["app_modern_002", {
      name: "ModernApp",
      approvedScopes: ["projects:read", "users:read"],  // already using new format
      grantedNewScopes: ["projects:read", "users:read"],
    }],
    ["app_admin_003", {
      name: "AdminTool",
      approvedScopes: ["admin"],
      grantedNewScopes: ["projects:read", "projects:write", "users:read", "users:write", "billing:read", "billing:admin", "settings:admin"],
    }],
  ]);

  // Active refresh tokens with old scope format
  const refreshTokens = new Map([
    ["rt_legacy_abc123", {
      clientId: "app_legacy_001",
      userId: "user_1",
      scopes: ["read", "write"],  // OLD format — needs migration on next use
      createdAt: Date.now() - 86400000,  // 1 day old
    }],
    ["rt_modern_def456", {
      clientId: "app_modern_002",
      userId: "user_2",
      scopes: ["projects:read", "users:read"],  // already new format
      createdAt: Date.now() - 3600000,
    }],
  ]);

  // Deprecation log
  const deprecationLog = [];

  return { scopeMapping, validNewScopes, clients, refreshTokens, deprecationLog };
}

module.exports = { createStore };
