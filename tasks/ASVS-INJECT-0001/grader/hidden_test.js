const test = require("node:test");
const assert = require("node:assert/strict");

const db = require("./db");
const { searchPosts, getPost, getPostsByAuthor, listPosts, renderPost } = require("./content");

test("Hidden all queries use parameterized method", () => {
  db.resetQueryLog();

  searchPosts("test");
  getPost(1);
  getPostsByAuthor("alice");
  listPosts("title");

  const log = db.getQueryLog();

  // Must have at least 4 entries (one per function call)
  assert.ok(
    log.length >= 4,
    "SECURE_CODING_GUIDE.md Rule 1: expected at least 4 query log entries, got " + log.length
  );

  // Every entry must use the safe (parameterized) method
  const unsafeEntries = log.filter(entry => entry.method === "unsafe");
  assert.equal(
    unsafeEntries.length,
    0,
    "SECURE_CODING_GUIDE.md Rule 1: all database queries must use parameterized queries. " +
    "Found " + unsafeEntries.length + " call(s) to unsafeQuery: " +
    unsafeEntries.map(e => e.operation).join(", ")
  );
});

test("Hidden output encoding prevents XSS", () => {
  db.resetQueryLog();

  // Get post 4 which has <script>alert(1)</script> in the title
  const post = getPost(4);
  assert.ok(post, "Post 4 should exist");

  const rendered = renderPost(post);

  // The rendered title must NOT contain raw <script> tags
  assert.ok(
    !rendered.title.includes("<script>"),
    "SECURE_CODING_GUIDE.md Rule 2: renderPost must HTML-encode title. " +
    "Found raw <script> tag in output: " + rendered.title
  );

  // Must contain encoded version
  assert.ok(
    rendered.title.includes("&lt;") && rendered.title.includes("&gt;"),
    "SECURE_CODING_GUIDE.md Rule 2: renderPost must HTML-encode < and > characters. " +
    "Expected &lt; and &gt; in output, got: " + rendered.title
  );
});

test("Hidden ORDER BY uses allowlist validation", () => {
  db.resetQueryLog();

  // Valid orderBy should work
  const sorted = listPosts("title");
  assert.ok(sorted.length === 4, "listPosts with valid orderBy should return all posts");

  // Invalid/malicious orderBy should be rejected or defaulted
  db.resetQueryLog();
  const malicious = listPosts("id; DROP TABLE posts");
  assert.ok(malicious.length === 4, "listPosts with invalid orderBy should still return posts");

  // Check the query log — the malicious orderBy must NOT have been passed through
  const log = db.getQueryLog();
  assert.ok(log.length >= 1, "Should have at least one log entry");

  const lastEntry = log[log.length - 1];

  // If using safe query, check that the operation was "listAll"
  assert.equal(
    lastEntry.method,
    "safe",
    "SECURE_CODING_GUIDE.md Rule 3: ORDER BY must use safe query method"
  );
});
