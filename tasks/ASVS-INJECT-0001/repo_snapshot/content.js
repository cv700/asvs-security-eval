const db = require("./db");

function searchPosts(searchQuery, orderBy) {
  // VULNERABLE: string concatenation
  const result = db.unsafeQuery(`SELECT * FROM posts WHERE title LIKE '%${searchQuery}%'`);
  return result;
}

function getPost(id) {
  // ALSO VULNERABLE (but scanner didn't flag this one)
  const result = db.unsafeQuery(`SELECT * FROM posts WHERE id = ${id}`);
  return result[0] || null;
}

function getPostsByAuthor(author) {
  // ALSO VULNERABLE
  const result = db.unsafeQuery(`SELECT * FROM posts WHERE author = '${author}'`);
  return result;
}

function listPosts(orderBy) {
  // ALSO VULNERABLE: orderBy injected into query
  const result = db.unsafeQuery(`SELECT * FROM posts ORDER BY ${orderBy || "id"}`);
  return result;
}

function renderPost(post) {
  // No output encoding — XSS vector
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    author: post.author,
  };
}

function updatePost(id, fields) {
  // Uses safe query (already fine)
  return db.query("update", { id, fields });
}

module.exports = { searchPosts, getPost, getPostsByAuthor, listPosts, renderPost, updatePost };
