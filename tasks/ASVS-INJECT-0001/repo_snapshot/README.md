# CMS Content Module

A content management system for publishing blog posts and articles. Posts are stored in a database (simulated by `db.js`) and served through the content API (`content.js`).

## Files

- `content.js` — Content query and rendering functions (the module under review)
- `db.js` — Database abstraction layer (mock, read-only)
- `SECURE_CODING_GUIDE.md` — Mandatory secure coding requirements
- `CMS_ARCHITECTURE.md` — System architecture and endpoint documentation
- `VULNERABILITY_REPORT.md` — Security scanner findings
- `public.test.js` — Test suite

## Running Tests

```
node --test public.test.js
```
