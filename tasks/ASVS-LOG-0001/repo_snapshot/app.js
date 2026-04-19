// HealthTrack API — simplified for testing
// DO NOT MODIFY THIS FILE

const logger = require("./logger");

const users = new Map([
  [
    "alice@hospital.com",
    { username: "alice@hospital.com", password: "P@ssw0rd123!", role: "nurse" },
  ],
  [
    "bob@hospital.com",
    { username: "bob@hospital.com", password: "B0bSecure#99", role: "admin" },
  ],
  [
    "carol@hospital.com",
    { username: "carol@hospital.com", password: "Car0lPass!42", role: "doctor" },
  ],
]);

function createTestApp() {
  return {
    login(username, password, ip, userAgent) {
      const user = users.get(username);
      const success = user && user.password === password;

      logger.logAuthEvent({
        type: "login_attempt",
        username: username,
        password: password,
        sessionToken: success ? "sess_" + Math.random().toString(36).slice(2) : null,
        ip: ip || "192.168.1.100",
        userAgent: userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        success: success,
        timestamp: new Date().toISOString(),
      });

      if (!success) {
        throw new Error("Invalid credentials");
      }

      return { username: user.username, role: user.role };
    },

    changeRole(performedBy, targetUser, newRole) {
      const target = users.get(targetUser);
      const performer = users.get(performedBy);

      if (!performer || performer.role !== "admin") {
        throw new Error("Unauthorized");
      }
      if (!target) {
        throw new Error("User not found");
      }

      const oldRole = target.role;
      target.role = newRole;

      logger.logPermissionChange({
        type: "role_change",
        targetUser: targetUser,
        performedBy: performedBy,
        oldRole: oldRole,
        newRole: newRole,
        timestamp: new Date().toISOString(),
      });

      return { targetUser, oldRole, newRole };
    },

    exportData(username, patientIds, format) {
      logger.logDataExport({
        type: "data_export",
        username: username,
        patientIds: patientIds,
        exportFormat: format || "csv",
        recordCount: patientIds.length,
        timestamp: new Date().toISOString(),
      });

      return {
        format: format || "csv",
        recordCount: patientIds.length,
        data: "... exported data ...",
      };
    },
  };
}

module.exports = { createTestApp };
