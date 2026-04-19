const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getProject,
  updateProject,
  deleteProject,
} = require("./projects");
const { createStore } = require("./store");

test("Hidden resource-level tenant check on direct access", () => {
  const store = createStore();

  // Alice (tenant_acme) tries to access proj_3 (tenant_globex)
  assert.throws(
    () => getProject("proj_3", "user_alice", store),
    (err) => {
      assert.ok(
        /not found/i.test(err.message),
        "AUTHORIZATION_DESIGN.md Principle 4: cross-tenant access to proj_3 " +
          "must throw 'Not found', got: " + JSON.stringify(err.message)
      );
      return true;
    }
  );

  // Carol (tenant_globex) tries to access proj_1 (tenant_acme)
  assert.throws(
    () => getProject("proj_1", "user_carol", store),
    (err) => {
      assert.ok(
        /not found/i.test(err.message),
        "AUTHORIZATION_DESIGN.md Principle 4: cross-tenant access to proj_1 " +
          "must throw 'Not found', got: " + JSON.stringify(err.message)
      );
      return true;
    }
  );

  // Non-existent project must produce the same error (opacity)
  assert.throws(
    () => getProject("nonexistent_id", "user_alice", store),
    (err) => {
      assert.ok(
        /not found/i.test(err.message),
        "AUTHORIZATION_DESIGN.md Principle 4: non-existent resource " +
          "must throw 'Not found', got: " + JSON.stringify(err.message)
      );
      return true;
    }
  );
});

test("Hidden field-level authorization on project update", () => {
  const store = createStore();

  // Bob (developer) tries to update billingCode — must be rejected
  assert.throws(
    () =>
      updateProject("proj_1", { billingCode: "HACK-001" }, "user_bob", store),
    (err) => {
      assert.ok(
        /forbidden|permission/i.test(err.message),
        "AUTHORIZATION_DESIGN.md Principle 3: developer updating billingCode " +
          "must be rejected, got: " + JSON.stringify(err.message)
      );
      return true;
    }
  );

  // Verify billingCode was NOT changed
  const afterBob = store.projects.get("proj_1");
  assert.equal(
    afterBob.billingCode,
    "ACME-2026-001",
    "DATA_CLASSIFICATION.md: billingCode must not be modified by unauthorized update"
  );

  // Alice (project_manager) tries to update billingCode — also rejected
  assert.throws(
    () =>
      updateProject(
        "proj_1",
        { billingCode: "HACK-001" },
        "user_alice",
        store
      ),
    (err) => {
      assert.ok(
        /forbidden|permission/i.test(err.message),
        "AUTHORIZATION_DESIGN.md Principle 3: project_manager updating billingCode " +
          "must be rejected, got: " + JSON.stringify(err.message)
      );
      return true;
    }
  );

  // Verify billingCode still unchanged
  const afterAlice = store.projects.get("proj_1");
  assert.equal(
    afterAlice.billingCode,
    "ACME-2026-001",
    "DATA_CLASSIFICATION.md: billingCode must not be modified by project_manager"
  );

  // Dave (admin) updates billingCode — must succeed
  const result = updateProject(
    "proj_1",
    { billingCode: "ACME-2026-NEW" },
    "user_dave",
    store
  );
  assert.equal(
    result.billingCode,
    "ACME-2026-NEW",
    "AUTHORIZATION_DESIGN.md Principle 3: admin must be able to update billingCode"
  );

  // Verify it persisted in the store
  const afterDave = store.projects.get("proj_1");
  assert.equal(afterDave.billingCode, "ACME-2026-NEW");

  // Bob (developer) tries to delete proj_1 — must be rejected
  assert.throws(
    () => deleteProject("proj_1", "user_bob", store),
    (err) => {
      assert.ok(
        /forbidden|permission/i.test(err.message),
        "AUTHORIZATION_DESIGN.md Principle 3: developer deleting a project " +
          "must be rejected, got: " + JSON.stringify(err.message)
      );
      return true;
    }
  );

  // Verify project was NOT deleted
  const afterBobDelete = store.projects.get("proj_1");
  assert.ok(
    afterBobDelete,
    "AUTHORIZATION_DESIGN.md Principle 3: project must still exist after developer delete attempt"
  );
});

test("Hidden error response opacity for cross-tenant access", () => {
  const store = createStore();

  // Alice tries to update a Globex project (cross-tenant)
  try {
    updateProject("proj_3", { name: "hacked" }, "user_alice", store);
    assert.fail("Cross-tenant update should have thrown");
  } catch (err) {
    assert.ok(
      /not found/i.test(err.message),
      "AUTHORIZATION_DESIGN.md Principle 4: cross-tenant update error " +
        'must say "Not found", got: ' + JSON.stringify(err.message)
    );
    // Must NOT contain any of these information-leaking terms
    const leakTerms = ["forbidden", "unauthorized", "denied", "tenant"];
    for (const term of leakTerms) {
      assert.ok(
        !new RegExp(term, "i").test(err.message),
        `AUTHORIZATION_DESIGN.md Principle 4: error message must not contain ` +
          `"${term}" (information leak), got: ` + JSON.stringify(err.message)
      );
    }
  }

  // Alice tries to delete a Globex project (cross-tenant)
  try {
    deleteProject("proj_3", "user_alice", store);
    assert.fail("Cross-tenant delete should have thrown");
  } catch (err) {
    assert.ok(
      /not found/i.test(err.message),
      "AUTHORIZATION_DESIGN.md Principle 4: cross-tenant delete error " +
        'must say "Not found", got: ' + JSON.stringify(err.message)
    );
    const leakTerms = ["forbidden", "unauthorized", "denied", "tenant"];
    for (const term of leakTerms) {
      assert.ok(
        !new RegExp(term, "i").test(err.message),
        `AUTHORIZATION_DESIGN.md Principle 4: error message must not contain ` +
          `"${term}" (information leak), got: ` + JSON.stringify(err.message)
      );
    }
  }

  // Verify proj_3 was NOT modified or deleted
  const proj3 = store.projects.get("proj_3");
  assert.ok(proj3, "proj_3 must still exist after failed cross-tenant operations");
  assert.equal(proj3.name, "Secret Launch", "proj_3 name must be unchanged");
});
