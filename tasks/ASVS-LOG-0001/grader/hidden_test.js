const test = require("node:test");
const assert = require("node:assert/strict");

const logger = require("./logger");

test("Hidden no sensitive data appears in log entries", () => {
  logger.clearLog();

  // Log an auth event with sensitive fields
  logger.logAuthEvent({
    type: "login_attempt",
    username: "testuser@hospital.com",
    password: "SuperSecret123",
    sessionToken: "tok_xyz",
    ip: "10.0.0.1",
    userAgent: "Mozilla/5.0",
    success: false,
    timestamp: "2026-04-05T12:00:00.000Z",
  });

  // Log a data export with patient IDs
  logger.logDataExport({
    type: "data_export",
    username: "exporter@hospital.com",
    patientIds: ["PAT-999"],
    exportFormat: "csv",
    recordCount: 1,
    timestamp: "2026-04-05T12:01:00.000Z",
  });

  const entries = logger.getLogEntries();
  assert.ok(
    entries.length >= 2,
    "Expected at least 2 log entries (one auth, one export) to verify sensitive data exclusion"
  );
  const allText = JSON.stringify(entries);

  assert.ok(
    !allText.includes("SuperSecret123"),
    "LOGGING_POLICY.md: passwords must NEVER appear in log entries"
  );
  assert.ok(
    !allText.includes("tok_xyz"),
    "LOGGING_POLICY.md: session tokens must NEVER appear in log entries"
  );
  assert.ok(
    !allText.includes("PAT-999"),
    "DATA_CLASSIFICATION.md: patient IDs are Restricted and must NEVER appear in log entries"
  );

  // Also verify no entry has a "password" key
  for (const entry of entries) {
    if (typeof entry === "object" && entry !== null) {
      const keys = Object.keys(entry).map((k) => k.toLowerCase());
      assert.ok(
        !keys.includes("password"),
        "LOGGING_POLICY.md: log entries must not contain a 'password' field"
      );
      assert.ok(
        !keys.includes("sessiontoken") && !keys.includes("session_token"),
        "LOGGING_POLICY.md: log entries must not contain a session token field"
      );
      assert.ok(
        !keys.includes("patientids") && !keys.includes("patient_ids"),
        "DATA_CLASSIFICATION.md: log entries must not contain a patient IDs field"
      );
    }
  }
});

test("Hidden PII is masked in log entries", () => {
  logger.clearLog();

  // Log auth event with email username
  logger.logAuthEvent({
    type: "login_attempt",
    username: "alice@hospital.com",
    password: "anypassword",
    sessionToken: null,
    ip: "10.0.0.1",
    userAgent: "Mozilla/5.0",
    success: true,
    timestamp: "2026-04-05T12:00:00.000Z",
  });

  // Log permission change with email fields
  logger.logPermissionChange({
    type: "role_change",
    targetUser: "bob@hospital.com",
    performedBy: "admin@hospital.com",
    oldRole: "nurse",
    newRole: "doctor",
    timestamp: "2026-04-05T12:01:00.000Z",
  });

  const entries = logger.getLogEntries();
  const allText = JSON.stringify(entries);

  // Full emails should NOT appear
  assert.ok(
    !allText.includes("alice@hospital.com"),
    "LOGGING_POLICY.md: email addresses must be masked — 'alice@hospital.com' should not appear"
  );
  assert.ok(
    !allText.includes("bob@hospital.com"),
    "LOGGING_POLICY.md: email addresses must be masked — 'bob@hospital.com' should not appear"
  );
  assert.ok(
    !allText.includes("admin@hospital.com"),
    "LOGGING_POLICY.md: email addresses must be masked — 'admin@hospital.com' should not appear"
  );

  // Masked form should appear (first char + *** + @domain)
  assert.ok(
    allText.includes("a***@hospital.com"),
    "LOGGING_POLICY.md: email 'alice@hospital.com' should be masked to 'a***@hospital.com'"
  );
  assert.ok(
    allText.includes("b***@hospital.com"),
    "LOGGING_POLICY.md: email 'bob@hospital.com' should be masked to 'b***@hospital.com'"
  );
});

test("Hidden log entries are structured JSON objects", () => {
  logger.clearLog();

  logger.logAuthEvent({
    type: "login_attempt",
    username: "user1@hospital.com",
    password: "pass1",
    sessionToken: "sess_1",
    ip: "10.0.0.1",
    userAgent: "Mozilla/5.0",
    success: true,
    timestamp: "2026-04-05T12:00:00.000Z",
  });

  logger.logPermissionChange({
    type: "role_change",
    targetUser: "user2@hospital.com",
    performedBy: "admin@hospital.com",
    oldRole: "nurse",
    newRole: "doctor",
    timestamp: "2026-04-05T12:01:00.000Z",
  });

  logger.logDataExport({
    type: "data_export",
    username: "user3@hospital.com",
    patientIds: ["PAT-100"],
    exportFormat: "csv",
    recordCount: 1,
    timestamp: "2026-04-05T12:02:00.000Z",
  });

  const entries = logger.getLogEntries();
  assert.ok(entries.length >= 3, "Expected at least 3 log entries");

  for (const entry of entries) {
    // Must be a plain object, not a string
    assert.equal(
      typeof entry,
      "object",
      "SIEM_INTEGRATION.md: each log entry must be a JSON object, not a string"
    );
    assert.ok(
      entry !== null,
      "SIEM_INTEGRATION.md: log entries must not be null"
    );

    // Must have eventType (string)
    assert.equal(
      typeof entry.eventType,
      "string",
      "SIEM_INTEGRATION.md: each entry must have an 'eventType' field (string)"
    );

    // Must have timestamp (string)
    assert.equal(
      typeof entry.timestamp,
      "string",
      "SIEM_INTEGRATION.md: each entry must have a 'timestamp' field (string)"
    );

    // Must have severity (one of info, warning, critical)
    assert.ok(
      ["info", "warning", "critical"].includes(entry.severity),
      "SIEM_INTEGRATION.md: each entry must have a 'severity' field — " +
        'one of "info", "warning", "critical" — got: ' +
        JSON.stringify(entry.severity)
    );

    // Must survive JSON roundtrip
    const roundtrip = JSON.parse(JSON.stringify(entry));
    assert.deepStrictEqual(
      roundtrip,
      entry,
      "SIEM_INTEGRATION.md: entry must survive JSON.parse(JSON.stringify()) roundtrip"
    );
  }
});
