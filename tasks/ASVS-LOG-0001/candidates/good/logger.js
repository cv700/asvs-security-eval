// Security event logging module
// Implements LOGGING_POLICY.md, DATA_CLASSIFICATION.md, and SIEM_INTEGRATION.md

const logEntries = [];

/**
 * Mask an email address for PII protection.
 * "alice@hospital.com" -> "a***@hospital.com"
 */
function maskEmail(email) {
  if (!email || typeof email !== "string") return email;
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return "***";
  return email[0] + "***" + email.slice(atIndex);
}

function logAuthEvent(event) {
  // LOGGING_POLICY.md: log auth events with required fields
  // DATA_CLASSIFICATION.md: password and sessionToken are Restricted — strip them
  // PII: mask username (email)
  const entry = {
    eventType: event.type || "login_attempt",
    timestamp: event.timestamp || new Date().toISOString(),
    severity: event.success ? "info" : "warning",
    username: maskEmail(event.username),
    ip: event.ip || null,
    userAgent: event.userAgent || null,
    success: event.success,
  };

  logEntries.push(entry);
}

function logPermissionChange(event) {
  // LOGGING_POLICY.md: log role changes
  // PII: mask user-identifying email fields
  const entry = {
    eventType: event.type || "role_change",
    timestamp: event.timestamp || new Date().toISOString(),
    severity: "warning",
    performedBy: maskEmail(event.performedBy),
    targetUser: maskEmail(event.targetUser),
    oldRole: event.oldRole,
    newRole: event.newRole,
  };

  logEntries.push(entry);
}

function logDataExport(event) {
  // LOGGING_POLICY.md: log data exports
  // DATA_CLASSIFICATION.md: patientIds are Restricted — strip them
  // PII: mask username (email)
  const entry = {
    eventType: event.type || "data_export",
    timestamp: event.timestamp || new Date().toISOString(),
    severity: "info",
    username: maskEmail(event.username),
    exportFormat: event.exportFormat || null,
    recordCount: event.recordCount || 0,
  };

  logEntries.push(entry);
}

function getLogEntries() {
  return [...logEntries];
}

function clearLog() {
  logEntries.length = 0;
}

module.exports = {
  logAuthEvent,
  logPermissionChange,
  logDataExport,
  getLogEntries,
  clearLog,
};
