/**
 * Hidden tests for data deletion
 * These verify:
 * 1. Legal hold blocking
 * 2. Transaction retention with anonymization
 * 3. Activity log anonymization (not deletion)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from './store.js';
import { requestDeletion, getUser } from './deletion.js';

test('Hidden legal hold blocks deletion', () => {
  const store = createStore();

  // user_2 is under legal hold
  const user2Before = getUser('user_2', store);
  assert.equal(user2Before.legalHold, true, 'user_2 should be under legal hold');

  // Request deletion
  const requestId = requestDeletion('user_2', store);
  const request = store.deletionRequests.get(requestId);

  // Verify deletion was blocked
  assert.equal(request.status, 'held', 'Request status should be "held" for legal hold');

  // Verify user still exists
  const user2After = getUser('user_2', store);
  assert(user2After !== undefined, 'User under legal hold should not be deleted');

  // Verify files still exist
  const files = store.files.get('user_2');
  assert(files !== undefined && files.length > 0, 'User files should not be deleted');

  // Verify activity logs still exist
  const logs = store.activityLogs.get('user_2');
  assert(logs !== undefined && logs.length > 0, 'Activity logs should not be deleted');
});

test('Hidden transaction records retained and anonymized', () => {
  const store = createStore();

  // user_3 has 2 transaction logs
  const logsBeforeDeletion = store.activityLogs.get('user_3');
  assert.equal(logsBeforeDeletion.length, 2, 'user_3 should have 2 logs');
  assert(
    logsBeforeDeletion.every((log) => log.type === 'transaction'),
    'All logs should be transaction type'
  );

  // Request deletion
  requestDeletion('user_3', store);

  // Verify user is deleted
  assert(getUser('user_3', store) === undefined, 'User should be deleted');

  // Verify files are deleted
  const filesAfter = store.files.get('user_3');
  assert(
    filesAfter === undefined || filesAfter.length === 0,
    'Files should be deleted'
  );

  // Verify activity logs still exist but are anonymized
  const logsAfterDeletion = store.activityLogs.get('user_3');
  assert(logsAfterDeletion !== undefined && logsAfterDeletion.length === 2, 'Logs should still exist');

  logsAfterDeletion.forEach((log) => {
    // Verify userId is anonymized (not 'user_3')
    assert.notEqual(log.userId, 'user_3', 'userId should be anonymized');

    // Verify it's a hash (16 chars, hex)
    assert(/^[a-f0-9]{16}$/.test(log.userId), 'userId should be a 16-char hex hash');

    // Verify transaction amount is preserved
    assert(log.amount !== undefined, 'Transaction amount should be preserved');

    // Verify retainUntil is set
    assert(log.retainUntil !== undefined, 'retainUntil should be set for transactions');

    // Verify retainUntil is approximately 7 years from transaction
    const retentionDays = (log.retainUntil - log.timestamp) / (24 * 60 * 60 * 1000);
    assert(retentionDays >= 365 * 7 - 10 && retentionDays <= 365 * 7 + 10, 'retainUntil should be ~7 years from transaction');
  });
});

test('Hidden activity logs anonymized not deleted', () => {
  const store = createStore();

  // user_1 has 3 mixed logs: login, transaction, pageview
  const logsBeforeDeletion = store.activityLogs.get('user_1');
  assert.equal(logsBeforeDeletion.length, 3, 'user_1 should have 3 logs');

  const logIdsBefore = logsBeforeDeletion.map((log) => log.logId);

  // Request deletion
  requestDeletion('user_1', store);

  // Verify user is deleted
  assert(getUser('user_1', store) === undefined, 'User should be deleted');

  // Verify files are deleted
  const filesAfter = store.files.get('user_1');
  assert(
    filesAfter === undefined || filesAfter.length === 0,
    'Files should be deleted'
  );

  // Verify activity logs still exist
  const logsAfterDeletion = store.activityLogs.get('user_1');
  assert(logsAfterDeletion !== undefined && logsAfterDeletion.length === 3, 'All 3 logs should still exist');

  // Verify log IDs match (same log entries, anonymized)
  const logIdsAfter = logsAfterDeletion.map((log) => log.logId);
  assert.deepEqual(logIdsAfter, logIdsBefore, 'Log IDs should be preserved');

  logsAfterDeletion.forEach((log) => {
    // Verify userId is anonymized
    assert.notEqual(log.userId, 'user_1', 'userId should be anonymized');

    // Verify it's a 16-char hex hash
    assert(/^[a-f0-9]{16}$/.test(log.userId), 'userId should be a 16-char hex hash');

    // Verify action/type/timestamp are preserved
    assert(log.action !== undefined, 'action should be preserved');
    assert(log.type !== undefined, 'type should be preserved');
    assert(log.timestamp !== undefined, 'timestamp should be preserved');
  });
});
