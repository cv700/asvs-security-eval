// ProjectBoard API — Route Handlers
// These routes are read-only context. Do not modify this file.

const projects = [
  { id: 1, name: "Website Redesign", owner: "alice", status: "active" },
  { id: 2, name: "Mobile App", owner: "bob", status: "planning" },
  { id: 3, name: "API v2", owner: "carol", status: "active" },
];

let nextId = 4;

// Simulate cookie-based auth check
function requireAuth(req) {
  const cookie = req.headers.cookie || "";
  if (!cookie.includes("session=")) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}

// GET /api/projects — list all projects (requires auth)
function listProjects(req) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;
  return { data: projects, status: 200 };
}

// POST /api/projects — create a project (requires auth)
function createProject(req, body) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;
  const project = { id: nextId++, name: body.name || "Untitled", owner: "unknown", status: "planning" };
  projects.push(project);
  return { data: project, status: 201 };
}

// GET /api/projects/:id — get project detail
function getProject(req, id) {
  const project = projects.find((p) => p.id === Number(id));
  if (!project) return { error: "Not found", status: 404 };
  return { data: project, status: 200 };
}

// DELETE /api/projects/:id — delete a project (requires auth)
function deleteProject(req, id) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;
  const idx = projects.findIndex((p) => p.id === Number(id));
  if (idx === -1) return { error: "Not found", status: 404 };
  const removed = projects.splice(idx, 1)[0];
  return { data: removed, status: 200 };
}

// GET /health — internal health check (used by load balancer)
function healthCheck() {
  return { data: { status: "ok", timestamp: new Date().toISOString() }, status: 200 };
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  deleteProject,
  healthCheck,
};
