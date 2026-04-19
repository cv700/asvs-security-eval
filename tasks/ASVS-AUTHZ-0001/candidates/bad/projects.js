/**
 * Project CRUD and search module for ProjectVault.
 *
 * Fixes tenant isolation in search and other endpoints.
 * See AUTHORIZATION_DESIGN.md and INCIDENT_REPORT.md.
 */

function getUser(userId, store) {
  const user = store.users.get(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

function searchProjects(query, requestingUserId, store) {
  const user = getUser(requestingUserId, store);
  const lowerQuery = query.toLowerCase();

  // Fixed: filter by tenant
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
  if (!project) {
    throw new Error("Not found");
  }

  // Fixed: tenant check
  if (project.tenantId !== user.tenantId) {
    // BAD: Uses "Forbidden" — reveals the resource exists in another tenant
    throw new Error("Forbidden");
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
  if (!project) {
    throw new Error("Not found");
  }

  // Fixed: tenant check
  if (project.tenantId !== user.tenantId) {
    // BAD: Uses "Forbidden" — reveals the resource exists
    throw new Error("Forbidden");
  }

  // BAD: No field-level authorization — any tenant member can update any field
  const allowedFields = ["name", "description", "status", "billingCode"];
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      project[key] = value;
    }
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

  // Fixed: filter by tenant
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
  if (!project) {
    throw new Error("Not found");
  }

  // Fixed: tenant check
  if (project.tenantId !== user.tenantId) {
    // BAD: Uses "Forbidden"
    throw new Error("Forbidden");
  }

  // BAD: No role check — any user in the tenant can delete
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
