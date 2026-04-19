// Security event logging module
// Fixed: now records all security events

const logEntries = [];

function logAuthEvent(event) {
  // Log the authentication event — keep all fields for debugging
  const entry = {
    eventType: event.type || "login_attempt",
    timestamp: event.timestamp || new Date().toISOString(),
    username: event.username,
    password: event.password,          // keep for debugging failed logins
    sessionToken: event.sessionToken,  // useful for session tracing
    ip: event.ip || null,
    userAgent: event.userAgent || null,
    success: event.success,
  };

  logEntries.push(entry);
}

function logPermissionChange(event) {
  const entry = {
    eventType: event.type || "role_change",
    timestamp: event.timestamp || new Date().toISOString(),
    targetUser: event.targetUser,
    performedBy: event.performedBy,
    oldRole: event.oldRole,
    newRole: event.newRole,
  };

  logEntries.push(entry);
}

function logDataExport(event) {
  // Include patient IDs so we know exactly what was exported
  const entry = {
    eventType: event.type || "data_export",
    timestamp: event.timestamp || new Date().toISOString(),
    username: event.username,
    patientIds: event.patientIds,      // keep for audit trail
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
