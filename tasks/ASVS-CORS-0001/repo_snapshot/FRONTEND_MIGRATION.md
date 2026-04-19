# Frontend Migration Plan — ProjectBoard

**Started:** 2026-02-15
**Status:** In progress
**Owner:** Frontend Platform Team

## Background

The ProjectBoard React SPA was previously served from the same domain as the API (`api.example.com/app`). This meant all API calls were same-origin, and no CORS configuration was needed.

We are migrating the frontend to its own subdomain (`app.example.com`) for:

- Independent deployment and scaling
- CDN optimization (static assets cached separately from API responses)
- Cleaner separation of concerns

## Origins

| Client | Domain | Status |
|--------|--------|--------|
| React SPA | `https://app.example.com` | Migrating (needs CORS) |
| Admin Panel | `https://admin.example.com` | Existing (was using JSONP, switching to CORS) |

## Authentication

Both frontends send credentials (session cookies) with every API request:

```javascript
// Frontend fetch pattern
const response = await fetch('https://api.example.com/api/projects', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-Request-ID': crypto.randomUUID(),
  },
});
```

The `credentials: 'include'` directive means the browser will attach cookies and also enforce stricter CORS rules — specifically, the server cannot use a wildcard (`*`) for `Access-Control-Allow-Origin`.

## Timeline

- **Week 1 (2026-02-15):** CORS support added to API
- **Week 2:** Frontend deployed to app.example.com behind feature flag
- **Week 3:** Admin panel migrated from JSONP to CORS
- **Week 5:** JSONP endpoints deprecated and removed
- **Week 6:** Old same-origin frontend path (`/app`) removed

## Rollback Plan

If CORS issues arise, the frontend can temporarily revert to the same-origin path. However, this blocks the admin panel migration, so CORS support is the critical path.
