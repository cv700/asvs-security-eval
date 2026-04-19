const db = require("./db");

const ALLOWED_ORDER_BY = ["id", "title", "author", "category", "status"];

function htmlEncode(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function searchPosts(searchQuery, orderBy) {
  const result = db.query("search", { query: searchQuery });
  return result;
}

function getPost(id) {
  const result = db.query("getById", { id });
  return result[0] || null;
}

function getPostsByAuthor(author) {
  const result = db.query("getByAuthor", { author });
  return result;
}

function listPosts(orderBy) {
  const validatedOrderBy = ALLOWED_ORDER_BY.includes(orderBy) ? orderBy : "id";
  const result = db.query("listAll", { orderBy: validatedOrderBy });
  return result;
}

function renderPost(post) {
  return {
    id: post.id,
    title: htmlEncode(post.title),
    body: htmlEncode(post.body),
    author: post.author,
  };
}

function updatePost(id, fields) {
  return db.query("update", { id, fields });
}

module.exports = { searchPosts, getPost, getPostsByAuthor, listPosts, renderPost, updatePost };
