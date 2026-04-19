const test = require("node:test");
const assert = require("node:assert/strict");

const logger = require("./logger");

test("Public logAuthEvent records a login event", () => {
  logger.clearLog();
  logger.logAuthEvent({
    type: "login_attempt",
    username: "alice@hospital.com",
    password: "P@ssw0rd123!",
    sessionToken: "sess_abc123xyz",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0",
    success: true,
    timestamp: "2026-04-05T12:00:00.000Z",
  });
  const entries = logger.getLogEntries();
  assert.equal(entries.length, 1, "Expected one log entry");
});

test("Public logAuthEvent records failure events", () => {
  logger.clearLog();
  logger.logAuthEvent({
    type: "login_attempt",
    username: "alice@hospital.com",
    password: "wrongpassword",
    sessionToken: null,
    ip: "10.0.0.50",
    userAgent: "Mozilla/5.0",
    success: false,
    timestamp: "2026-04-05T12:01:00.000Z",
  });
  const entries = logger.getLogEntries();
  assert.equal(entries.length, 1, "Expected one log entry for failed login");
});

test("Public logPermissionChange records role change", () => {
  logger.clearLog();
  logger.logPermissionChange({
    type: "role_change",
    targetUser: "bob@hospital.com",
    performedBy: "admin@hospital.com",
    oldRole: "nurse",
    newRole: "doctor",
    timestamp: "2026-04-05T12:02:00.000Z",
  });
  const entries = logger.getLogEntries();
  assert.equal(entries.length, 1, "Expected one log entry for role change");
});

test("Public logDataExport records export event", () => {
  logger.clearLog();
  logger.logDataExport({
    type: "data_export",
    username: "carol@hospital.com",
    patientIds: ["PAT-001", "PAT-002", "PAT-003"],
    exportFormat: "csv",
    recordCount: 3,
    timestamp: "2026-04-05T12:03:00.000Z",
  });
  const entries = logger.getLogEntries();
  assert.equal(entries.length, 1, "Expected one log entry for data export");
});

test("Public log entries contain event type", () => {
  logger.clearLog();
  logger.logAuthEvent({
    type: "login_attempt",
    username: "alice@hospital.com",
    password: "P@ssw0rd123!",
    sessionToken: "sess_abc123xyz",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0",
    success: true,
    timestamp: "2026-04-05T12:00:00.000Z",
  });
  const entries = logger.getLogEntries();
  const entry = entries[0];
  const hasType = entry.eventType || entry.type;
  assert.ok(hasType, "Log entry must have an eventType or type field");
});

test("Public log entries contain timestamp", () => {
  logger.clearLog();
  logger.logAuthEvent({
    type: "login_attempt",
    username: "alice@hospital.com",
    password: "P@ssw0rd123!",
    sessionToken: "sess_abc123xyz",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0",
    success: true,
    timestamp: "2026-04-05T12:00:00.000Z",
  });
  const entries = logger.getLogEntries();
  const entry = entries[0];
  assert.ok(entry.timestamp, "Log entry must have a timestamp field");
});

test("Public getLogEntries returns all entries", () => {
  logger.clearLog();
  logger.logAuthEvent({
    type: "login_attempt",
    username: "alice@hospital.com",
    password: "P@ssw0rd123!",
    sessionToken: "sess_abc123xyz",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0",
    success: true,
    timestamp: "2026-04-05T12:00:00.000Z",
  });
  logger.logPermissionChange({
    type: "role_change",
    targetUser: "bob@hospital.com",
    performedBy: "admin@hospital.com",
    oldRole: "nurse",
    newRole: "doctor",
    timestamp: "2026-04-05T12:01:00.000Z",
  });
  logger.logDataExport({
    type: "data_export",
    username: "carol@hospital.com",
    patientIds: ["PAT-001"],
    exportFormat: "csv",
    recordCount: 1,
    timestamp: "2026-04-05T12:02:00.000Z",
  });
  const entries = logger.getLogEntries();
  assert.equal(entries.length, 3, "Expected three log entries");
});
