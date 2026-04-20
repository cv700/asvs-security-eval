/**
 * Data deletion module - INCOMPLETE IMPLEMENTATION
 * Bug: deletion only marks the request but doesn't actually
 * remove user data, files, or handle activity logs.
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

  // BUG: Only marks request as completed without actually deleting anything
  request.status = 'completed';
  request.completedAt = Date.now();
}

export function getUser(userId, store) {
  return store.users.get(userId);
}
