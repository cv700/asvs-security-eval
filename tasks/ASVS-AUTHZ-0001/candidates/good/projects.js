/**
 * Project CRUD and search module for ProjectVault.
 *
 * Fixes tenant isolation in search and all endpoints.
 * Implements field-level authorization per AUTHORIZATION_DESIGN.md.
 * Implements error opacity per Principle 4.
 * See AUTHORIZATION_DESIGN.md, INCIDENT_REPORT.md, DATA_CLASSIFICATION.md.
 */

function getUser(userId, store) {
  const user = store.users.get(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

// Field-level update permissions per role (AUTHORIZATION_DESIGN.md Principle 3)
const ROLE_UPDATE_FIELDS = {
  admin: ["name", "description", "status", "billingCode"],
  project_manager: ["name", "description", "status"],
  developer: ["status"],
};

function searchProjects(query, requestingUserId, store) {
  const user = getUser(requestingUserId, store);
  const lowerQuery = query.toLowerCase();

  // Principle 1: Query-level isolation — filter by tenant
  const results = [];
  for (const project of store.projects.values()) {
    if (
      project.tenantId === user.tenantId &&
      project.name.toLowerCase().includes(lowerQuery)
    ) {
      results.push({ projectId: project.projectId, name: project.name });
    }
  }
  return results;
}

function getProject(projectId, requestingUserId, store) {
  const user = getUser(requestingUserId, store);
  const project = store.projects.get(projectId);

  // Principle 4: Error opacity — same error for missing and cross-tenant
  if (!project || project.tenantId !== user.tenantId) {
    throw new Error("Not found");
  }

  return {
    projectId: project.projectId,
    name: project.name,
    description: project.description,
    billingCode: project.billingCode,
    status: project.status,
    createdBy: project.createdBy,
  };
}

function updateProject(projectId, updates, requestingUserId, store) {
  const user = getUser(requestingUserId, store);
  const project = store.projects.get(projectId);

  // Principle 4: Error opacity — same error for missing and cross-tenant
  if (!project || project.tenantId !== user.tenantId) {
    throw new Error("Not found");
  }

  // Principle 3: Field-level authorization
  const allowedFields = ROLE_UPDATE_FIELDS[user.role] || [];
  for (const key of Object.keys(updates)) {
    if (!allowedFields.includes(key)) {
      throw new Error(
        `Forbidden: insufficient permissions for field '${key}'`
      );
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    project[key] = value;
  }

  return {
    projectId: project.projectId,
    name: project.name,
    description: project.description,
    billingCode: project.billingCode,
    status: project.status,
    createdBy: project.createdBy,
  };
}

function listProjects(requestingUserId, store) {
  const user = getUser(requestingUserId, store);

  // Principle 1: Query-level isolation — filter by tenant
  const results = [];
  for (const project of store.projects.values()) {
    if (project.tenantId === user.tenantId) {
      results.push({ projectId: project.projectId, name: project.name });
    }
  }
  return results;
}

function deleteProject(projectId, requestingUserId, store) {
  const user = getUser(requestingUserId, store);
  const project = store.projects.get(projectId);

  // Principle 4: Error opacity — same error for missing and cross-tenant
  if (!project || project.tenantId !== user.tenantId) {
    throw new Error("Not found");
  }

  // Principle 5: Only project_manager and admin can delete
  if (user.role !== "project_manager" && user.role !== "admin") {
    throw new Error("Forbidden: insufficient permissions to delete projects");
  }

  store.projects.delete(projectId);
  return { deleted: true, projectId };
}

module.exports = {
  searchProjects,
  getProject,
  updateProject,
  listProjects,
  deleteProject,
};
