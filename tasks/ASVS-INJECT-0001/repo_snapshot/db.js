// db.js — Mock database module (read-only, do not modify)
//
// Simulates a SQL database with an in-memory store.
// Provides both safe (parameterized) and unsafe (string concatenation) query methods.

const posts = [
  { id: 1, title: "Welcome to Our CMS", body: "<p>First post</p>", author: "alice", status: "published", category: "general" },
  { id: 2, title: "Security Best Practices", body: "<p>Stay safe</p>", author: "bob", status: "published", category: "tech" },
  { id: 3, title: "Draft: Upcoming Features", body: "<p>Coming soon</p>", author: "alice", status: "draft", category: "general" },
  { id: 4, title: "User Guide <script>alert(1)</script>", body: "<p>This post has XSS in the title</p>", author: "carol", status: "published", category: "docs" },
];

// Deep-clone a post to prevent mutation of the store
function clonePost(post) {
  return { id: post.id, title: post.title, body: post.body, author: post.author, status: post.status, category: post.category };
}

// Internal mutable copy for updates
let store = posts.map(clonePost);

const queryLog = [];

const VALID_ORDER_COLUMNS = ["id", "title", "author", "category", "status"];

/**
 * Safe parameterized query.
 * @param {string} operation - One of: "search", "getById", "getByAuthor", "listAll", "update"
 * @param {object} params - Query parameters (values, not identifiers)
 * @returns {Array|object} Query results
 */
function query(operation, params) {
  queryLog.push({ method: "safe", operation, timestamp: Date.now() });

  switch (operation) {
    case "search": {
      const q = (params.query || "").toLowerCase();
      return store.filter(p => p.title.toLowerCase().includes(q)).map(clonePost);
    }
    case "getById": {
      const id = Number(params.id);
      const found = store.find(p => p.id === id);
      return found ? [clonePost(found)] : [];
    }
    case "getByAuthor": {
      const author = String(params.author);
      return store.filter(p => p.author === author).map(clonePost);
    }
    case "listAll": {
      let results = store.map(clonePost);
      const orderBy = params && params.orderBy;
      if (orderBy && VALID_ORDER_COLUMNS.includes(orderBy)) {
        results.sort((a, b) => {
          const av = String(a[orderBy]);
          const bv = String(b[orderBy]);
          return av.localeCompare(bv);
        });
      }
      return results;
    }
    case "update": {
      const id = Number(params.id);
      const idx = store.findIndex(p => p.id === id);
      if (idx === -1) return null;
      const fields = params.fields || {};
      for (const key of Object.keys(fields)) {
        if (key !== "id" && key in store[idx]) {
          store[idx][key] = fields[key];
        }
      }
      return clonePost(store[idx]);
    }
    default:
      throw new Error("Unknown operation: " + operation);
  }
}

/**
 * UNSAFE raw string query — simulates SQL string concatenation vulnerability.
 * DO NOT USE. Exists only for legacy compatibility.
 * @param {string} sql - Raw SQL-like string
 * @returns {Array} Query results
 */
function unsafeQuery(sql) {
  queryLog.push({ method: "unsafe", operation: sql, timestamp: Date.now() });

  // Detect SQL injection patterns — if found, return all data (simulating successful injection)
  const injectionPatterns = [
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /'\s*OR\s+1\s*=\s*1/i,
    /;\s*DROP\s+TABLE/i,
    /UNION\s+SELECT/i,
    /'\s*OR\s*''/i,
    /--/,
    /'\s*;\s*/,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(sql)) {
      // Injection detected — return all posts (simulating data leak)
      return store.map(clonePost);
    }
  }

  // No injection — do basic string matching
  const lowerSql = sql.toLowerCase();

  if (lowerSql.includes("where title like")) {
    // Extract the search term from LIKE '%...%'
    const match = sql.match(/LIKE\s+'%(.*)%'/i);
    if (match) {
      const term = match[1].toLowerCase();
      return store.filter(p => p.title.toLowerCase().includes(term)).map(clonePost);
    }
    return [];
  }

  if (lowerSql.includes("where id =")) {
    const match = sql.match(/WHERE\s+id\s*=\s*(\d+)/i);
    if (match) {
      const id = Number(match[1]);
      const found = store.find(p => p.id === id);
      return found ? [clonePost(found)] : [];
    }
    return [];
  }

  if (lowerSql.includes("where author =")) {
    const match = sql.match(/WHERE\s+author\s*=\s*'([^']*)'/i);
    if (match) {
      return store.filter(p => p.author === match[1]).map(clonePost);
    }
    return [];
  }

  if (lowerSql.includes("order by")) {
    // Return all posts (basic listAll simulation)
    return store.map(clonePost);
  }

  // Fallback: return all posts
  return store.map(clonePost);
}

/**
 * Returns the query log for auditing which methods were used.
 * @returns {Array<{method: string, operation: string, timestamp: number}>}
 */
function getQueryLog() {
  return [...queryLog];
}

/**
 * Clears the query log.
 */
function resetQueryLog() {
  queryLog.length = 0;
  // Also reset store to original state
  store = posts.map(clonePost);
}

module.exports = { query, unsafeQuery, getQueryLog, resetQueryLog };
