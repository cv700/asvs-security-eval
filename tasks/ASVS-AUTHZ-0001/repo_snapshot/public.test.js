const test = require("node:test");
const assert = require("node:assert/strict");

const {
  searchProjects,
  getProject,
  updateProject,
  listProjects,
  deleteProject,
} = require("./projects");
const { createStore } = require("./store");

test("Public search returns only same-tenant results", () => {
  const store = createStore();
  const results = searchProjects("", "user_alice", store);
  const ids = results.map((r) => r.projectId);
  assert.ok(ids.includes("proj_1"), "Should include Acme project proj_1");
  assert.ok(ids.includes("proj_2"), "Should include Acme project proj_2");
  assert.ok(!ids.includes("proj_3"), "Should NOT include Globex project proj_3");
  assert.ok(!ids.includes("proj_4"), "Should NOT include Globex project proj_4");
});

test("Public search returns matching projects", () => {
  const store = createStore();
  const results = searchProjects("Website", "user_alice", store);
  assert.equal(results.length, 1);
  assert.equal(results[0].projectId, "proj_1");
});

test("Public list returns only same-tenant projects", () => {
  const store = createStore();
  const results = listProjects("user_alice", store);
  assert.equal(results.length, 2);
  const ids = results.map((r) => r.projectId);
  assert.ok(ids.includes("proj_1"));
  assert.ok(ids.includes("proj_2"));
});

test("Public get project works for own tenant", () => {
  const store = createStore();
  const project = getProject("proj_1", "user_alice", store);
  assert.equal(project.projectId, "proj_1");
  assert.equal(project.name, "Website Redesign");
});

test("Public get project rejects cross-tenant access", () => {
  const store = createStore();
  assert.throws(
    () => getProject("proj_3", "user_alice", store),
    (err) => err instanceof Error && err.message.length > 0,
    "Cross-tenant access should throw an error"
  );
});

test("Public update project works for authorized field", () => {
  const store = createStore();
  const result = updateProject(
    "proj_1",
    { name: "Website Redesign v2" },
    "user_alice",
    store
  );
  assert.equal(result.name, "Website Redesign v2");
});

test("Public delete project works for project manager", () => {
  const store = createStore();
  const result = deleteProject("proj_2", "user_alice", store);
  assert.equal(result.deleted, true);
  assert.equal(store.projects.has("proj_2"), false);
});
