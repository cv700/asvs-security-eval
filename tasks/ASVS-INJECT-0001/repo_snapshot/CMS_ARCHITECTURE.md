# CMS Architecture

## Overview

The CMS manages blog posts and articles. Content is stored in a database (simulated by `db.js` in this environment) and queried through the content module (`content.js`).

## Query Endpoints

The content module exposes four query functions:

1. **searchPosts(query, orderBy)** — Full-text search across post titles. Returns matching posts.
2. **getPost(id)** — Retrieve a single post by its ID.
3. **getPostsByAuthor(author)** — Retrieve all posts by a given author.
4. **listPosts(orderBy)** — List all posts, optionally sorted by a column.

## Mutation Endpoints

5. **updatePost(id, fields)** — Update a post's fields. Already uses parameterized queries.

## Rendering Pipeline

Raw database data flows through the `renderPost` function before being sent to the HTML template:

```
Database → raw post object → renderPost() → HTML template
```

The `renderPost` function is the encoding layer. It is responsible for ensuring that any user-generated content (titles, body text) is safe for HTML output.

## Test Data

Post 4 ("User Guide") was created by a user who included a `<script>` tag in the title. This is a known XSS test case that the rendering pipeline must handle safely.

## Security Scanner Coverage

The security scanner only tested the `searchPosts` endpoint. The other three query endpoints (`getPost`, `getPostsByAuthor`, `listPosts`) use the same query pattern but were not included in the scanner's test scope. Manual review of the full codebase is recommended to identify and fix any additional instances of the same vulnerability.
