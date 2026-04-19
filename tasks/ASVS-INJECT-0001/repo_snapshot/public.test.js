const test = require("node:test");
const assert = require("node:assert/strict");

const db = require("./db");
const { searchPosts, getPost, getPostsByAuthor, listPosts, renderPost, updatePost } = require("./content");

test("Public search returns matching posts", () => {
  db.resetQueryLog();
  const results = searchPosts("Welcome");
  assert.ok(results.length >= 1, "Should find at least one post");
  assert.ok(results.some(p => p.title.includes("Welcome")), "Should find the Welcome post");
});

test("Public search injection is prevented", () => {
  db.resetQueryLog();
  const results = searchPosts("' OR '1'='1");
  // If injection is prevented, this should NOT return all 4 posts
  assert.ok(results.length < 4, "Injection should not return all posts (got " + results.length + ")");
});

test("Public getPost returns correct post", () => {
  db.resetQueryLog();
  const post = getPost(1);
  assert.ok(post, "Should return a post");
  assert.equal(post.id, 1);
  assert.equal(post.title, "Welcome to Our CMS");
});

test("Public getPostsByAuthor works", () => {
  db.resetQueryLog();
  const results = getPostsByAuthor("alice");
  assert.ok(results.length >= 2, "Alice should have at least 2 posts");
  assert.ok(results.every(p => p.author === "alice"), "All posts should be by alice");
});

test("Public listPosts returns all posts", () => {
  db.resetQueryLog();
  const results = listPosts();
  assert.equal(results.length, 4, "Should return all 4 posts");
});

test("Public renderPost returns post data", () => {
  const post = { id: 1, title: "Test Post", body: "<p>Hello</p>", author: "testuser", status: "published", category: "general" };
  const rendered = renderPost(post);
  assert.ok(rendered.title, "Should have title");
  assert.ok(rendered.body, "Should have body");
  assert.ok(rendered.author, "Should have author");
});

test("Public updatePost works", () => {
  db.resetQueryLog();
  const result = updatePost(1, { status: "draft" });
  assert.ok(result, "Should return updated post");
  assert.equal(result.status, "draft");
});
