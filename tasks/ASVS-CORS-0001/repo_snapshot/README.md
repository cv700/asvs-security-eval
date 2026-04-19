# ProjectBoard API

REST API for the ProjectBoard project management application. Approximately 8,000 active users across two frontend clients.

## Current State

The API has been running at api.example.com since 2024. Until recently, the React frontend was served from the same domain (same-origin), so CORS was not needed. A new deployment architecture splits the frontend onto its own subdomain (app.example.com), and the admin panel already runs on admin.example.com.

API calls from the new frontend are failing with CORS errors in the browser. The server does not currently set any CORS headers.

## Key Documents

- `CORS_POLICY.md` — The organization's CORS policy for this API
- `API_GATEWAY_SPEC.md` — Infrastructure and CDN configuration details
- `FRONTEND_MIGRATION.md` — Context on the frontend migration

## Module Structure

- `server.js` — HTTP server with CORS middleware (the file to fix)
- `routes.js` — API route handlers (read-only)
- `public.test.js` — Test suite
