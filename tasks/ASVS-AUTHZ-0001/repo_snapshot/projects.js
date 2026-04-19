/**
 * Project CRUD and search module for ProjectVault.
 *
 * TODO: Fix the tenant isolation issue reported in INCIDENT_REPORT.md.
 * See AUTHORIZATION_DESIGN.md for the authorization requirements.
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

  // BUG: Iterates ALL projects across all tenants
  const results = [];
  for (const project of store.projects.values()) {
    if (project.name.toLowerCase().includes(lowerQuery)) {
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

  // BUG: No tenant check — returns any project regardless of tenant
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

  // BUG: No tenant check — allows cross-tenant updates
  // BUG: No field-level authorization — anyone can update any field

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

  // BUG: Returns ALL projects across all tenants
  const results = [];
  for (const project of store.projects.values()) {
    results.push({ projectId: project.projectId, name: project.name });
  }
  return results;
}

function deleteProject(projectId, requestingUserId, store) {
  const user = getUser(requestingUserId, store);
  const project = store.projects.get(projectId);
  if (!project) {
    throw new Error("Not found");
  }

  // BUG: No tenant check — allows cross-tenant deletes
  // BUG: No role check — any user can delete
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
