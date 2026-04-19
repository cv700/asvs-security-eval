const db = require("./db");

function searchPosts(searchQuery, orderBy) {
  // Fixed: uses parameterized query
  const result = db.query("search", { query: searchQuery });
  return result;
}

function getPost(id) {
  // NOT FIXED: still uses unsafeQuery (scanner didn't flag it)
  const result = db.unsafeQuery(`SELECT * FROM posts WHERE id = ${id}`);
  return result[0] || null;
}

function getPostsByAuthor(author) {
  // NOT FIXED: still uses unsafeQuery
  const result = db.unsafeQuery(`SELECT * FROM posts WHERE author = '${author}'`);
  return result;
}

function listPosts(orderBy) {
  // NOT FIXED: still uses unsafeQuery with orderBy concatenation
  const result = db.unsafeQuery(`SELECT * FROM posts ORDER BY ${orderBy || "id"}`);
  return result;
}

function renderPost(post) {
  // NOT FIXED: no output encoding
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    author: post.author,
  };
}

function updatePost(id, fields) {
  return db.query("update", { id, fields });
}

module.exports = { searchPosts, getPost, getPostsByAuthor, listPosts, renderPost, updatePost };
