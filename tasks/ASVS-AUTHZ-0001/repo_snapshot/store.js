/**
 * Pre-populated multi-tenant data store for ProjectVault.
 *
 * Two tenants (Acme Corp, Globex Inc) with users and projects.
 * This simulates a production database snapshot.
 */
function createStore() {
  const users = new Map();
  const projects = new Map();

  // --- Tenant: Acme Corp ---

  users.set("user_alice", {
    userId: "user_alice",
    username: "Alice",
    tenantId: "tenant_acme",
    role: "project_manager",
  });

  users.set("user_bob", {
    userId: "user_bob",
    username: "Bob",
    tenantId: "tenant_acme",
    role: "developer",
  });

  users.set("user_dave", {
    userId: "user_dave",
    username: "Dave",
    tenantId: "tenant_acme",
    role: "admin",
  });

  // --- Tenant: Globex Inc ---

  users.set("user_carol", {
    userId: "user_carol",
    username: "Carol",
    tenantId: "tenant_globex",
    role: "project_manager",
  });

  // --- Projects: Acme Corp ---

  projects.set("proj_1", {
    projectId: "proj_1",
    tenantId: "tenant_acme",
    name: "Website Redesign",
    description: "Redesign the corporate website for 2026",
    billingCode: "ACME-2026-001",
    status: "active",
    createdBy: "user_alice",
  });

  projects.set("proj_2", {
    projectId: "proj_2",
    tenantId: "tenant_acme",
    name: "Mobile App",
    description: "Native mobile application for iOS and Android",
    billingCode: "ACME-2026-002",
    status: "active",
    createdBy: "user_bob",
  });

  // --- Projects: Globex Inc ---

  projects.set("proj_3", {
    projectId: "proj_3",
    tenantId: "tenant_globex",
    name: "Secret Launch",
    description: "Confidential product launch for Q3",
    billingCode: "GLOB-2026-001",
    status: "planning",
    createdBy: "user_carol",
  });

  projects.set("proj_4", {
    projectId: "proj_4",
    tenantId: "tenant_globex",
    name: "Internal Tool",
    description: "Internal productivity tool for Globex staff",
    billingCode: "GLOB-2026-002",
    status: "active",
    createdBy: "user_carol",
  });

  return { users, projects };
}

module.exports = { createStore };
