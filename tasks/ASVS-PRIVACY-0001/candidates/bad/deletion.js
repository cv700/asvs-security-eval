/**
 * Bad candidate: passes visible tests but fails hidden checks
 * Issues:
 * - Deletes all activity logs instead of anonymizing them
 * - No legal hold check
 * - No special handling for transaction retention
 */

import crypto from 'node:crypto';

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

  // Delete user record
  store.users.delete(userId);

  // Delete all files (correct)
  store.files.delete(userId);

  // BUG: Delete all activity logs instead of anonymizing
  store.activityLogs.delete(userId);

  // Mark as completed (NO legal hold check)
  request.status = 'completed';
  request.completedAt = Date.now();
}

export function getUser(userId, store) {
  return store.users.get(userId);
}
