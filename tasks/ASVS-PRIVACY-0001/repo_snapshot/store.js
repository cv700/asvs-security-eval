/**
 * In-memory data store for user data management
 */

export function createStore() {
  const store = {
    users: new Map(),
    activityLogs: new Map(),
    files: new Map(),
    deletionRequests: new Map(),
  };

  // Seed data

  // user_1: normal user (no legal hold)
  store.users.set('user_1', {
    userId: 'user_1',
    email: 'alice@example.com',
    name: 'Alice Smith',
    legalHold: false,
  });

  store.activityLogs.set('user_1', [
    {
      logId: 'log_1_a',
      userId: 'user_1',
      action: 'login',
      type: 'login',
      timestamp: Date.now() - 86400000, // 1 day ago
      metadata: { ip: '192.168.1.1' },
    },
    {
      logId: 'log_1_b',
      userId: 'user_1',
      action: 'payment_processed',
      type: 'transaction',
      timestamp: Date.now() - 172800000, // 2 days ago
      amount: 99.99,
      metadata: { method: 'credit_card' },
    },
    {
      logId: 'log_1_c',
      userId: 'user_1',
      action: 'page_view',
      type: 'pageview',
      timestamp: Date.now() - 259200000, // 3 days ago
      metadata: { page: '/dashboard' },
    },
  ]);

  store.files.set('user_1', [
    {
      fileId: 'file_1_a',
      userId: 'user_1',
      filename: 'report.pdf',
      size: 2048,
    },
    {
      fileId: 'file_1_b',
      userId: 'user_1',
      filename: 'data.csv',
      size: 4096,
    },
  ]);

  // user_2: user under legal hold
  store.users.set('user_2', {
    userId: 'user_2',
    email: 'bob@example.com',
    name: 'Bob Jones',
    legalHold: true,
  });

  store.activityLogs.set('user_2', [
    {
      logId: 'log_2_a',
      userId: 'user_2',
      action: 'login',
      type: 'login',
      timestamp: Date.now() - 86400000,
      metadata: { ip: '10.0.0.5' },
    },
    {
      logId: 'log_2_b',
      userId: 'user_2',
      action: 'export_data',
      type: 'pageview',
      timestamp: Date.now() - 172800000,
      metadata: { format: 'json' },
    },
  ]);

  store.files.set('user_2', [
    {
      fileId: 'file_2_a',
      userId: 'user_2',
      filename: 'config.json',
      size: 1024,
    },
  ]);

  // user_3: normal user with transaction logs
  store.users.set('user_3', {
    userId: 'user_3',
    email: 'carol@example.com',
    name: 'Carol Davis',
    legalHold: false,
  });

  store.activityLogs.set('user_3', [
    {
      logId: 'log_3_a',
      userId: 'user_3',
      action: 'subscription_charge',
      type: 'transaction',
      timestamp: Date.now() - 86400000,
      amount: 9.99,
      metadata: { plan: 'premium' },
    },
    {
      logId: 'log_3_b',
      userId: 'user_3',
      action: 'refund_issued',
      type: 'transaction',
      timestamp: Date.now() - 172800000,
      amount: -4.99,
      metadata: { reason: 'dispute' },
    },
  ]);

  store.files.set('user_3', [
    {
      fileId: 'file_3_a',
      userId: 'user_3',
      filename: 'invoice_jan.pdf',
      size: 512,
    },
  ]);

  return store;
}
