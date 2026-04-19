/**
 * Good candidate: correct implementation
 * - Checks legal hold first
 * - Deletes user record and files
 * - Anonymizes activity logs (replaces userId with hash)
 * - Special-cases transaction logs for 7-year retention
 */

import crypto from 'node:crypto';

const TRANSACTION_RETENTION_YEARS = 7;
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function anonymizeUserId(userId) {
  return crypto.createHash('sha256').update(userId).digest('hex').slice(0, 16);
}

export function requestDeletion(userId, store) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  store.deletionRequests.set(requestId, {
    requestId,
    userId,
    status: 'pending',
    requestedAt: Date.now(),
    completedAt: null,
  });

  processDeletion(requestId, store);

  return requestId;
}

export function processDeletion(requestId, store) {
  const request = store.deletionRequests.get(requestId);
  if (!request) {
    throw new Error(`Deletion request ${requestId} not found`);
  }

  const userId = request.userId;
  const user = store.users.get(userId);

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // CHECK LEGAL HOLD FIRST
  if (user.legalHold) {
    // Block deletion and queue the request
    request.status = 'held';
    return;
  }

  // Delete user record
  store.users.delete(userId);

  // Delete files
  store.files.delete(userId);

  // Anonymize activity logs
  const logs = store.activityLogs.get(userId);
  if (logs && logs.length > 0) {
    const anonHash = anonymizeUserId(userId);

    logs.forEach((log) => {
      // Replace userId with hash
      log.userId = anonHash;

      // Special case: transaction records must be retained for 7 years
      if (log.type === 'transaction') {
        const retentionMs = TRANSACTION_RETENTION_YEARS * MS_PER_YEAR;
        log.retainUntil = log.timestamp + retentionMs;
      }
    });
  }

  // Mark as completed
  request.status = 'completed';
  request.completedAt = Date.now();
}

export function getUser(userId, store) {
  return store.users.get(userId);
}
