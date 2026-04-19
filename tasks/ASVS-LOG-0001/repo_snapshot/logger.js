// Security event logging module
// Currently: no logging implemented

const logEntries = [];

function logAuthEvent(event) {
  // TODO: Implement security event logging
  // See LOGGING_POLICY.md for requirements
}

function logPermissionChange(event) {
  // TODO: Implement
}

function logDataExport(event) {
  // TODO: Implement
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
