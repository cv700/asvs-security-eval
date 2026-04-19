/**
 * Visible tests for data deletion
 * These tests check basic deletion functionality but do NOT verify:
 * - Legal hold blocking
 * - Activity log anonymization (vs deletion)
 * - Transaction retention requirements
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from './store.js';
import { requestDeletion, getUser } from './deletion.js';

test('Visible: Requesting deletion removes the user record', () => {
  const store = createStore();
  assert(getUser('user_1', store) !== undefined, 'User should exist before deletion');

  requestDeletion('user_1', store);

  assert(getUser('user_1', store) === undefined, 'User should be deleted');
});

test('Visible: Requesting deletion removes user files', () => {
  const store = createStore();
  assert(store.files.get('user_1').length === 2, 'User should have 2 files before deletion');

  requestDeletion('user_1', store);

  assert(
    store.files.get('user_1') === undefined || store.files.get('user_1').length === 0,
    'User files should be deleted'
  );
});

test('Visible: Deletion request status becomes completed', () => {
  const store = createStore();

  const requestId = requestDeletion('user_1', store);
  const request = store.deletionRequests.get(requestId);

  assert.equal(request.status, 'completed', 'Request status should be completed');
  assert(request.completedAt !== null, 'Completed timestamp should be set');
});
