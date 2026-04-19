# API Gateway Specification — ProjectBoard

**Last updated:** 2026-02-18
**Infra team contact:** ops@example.com

## CDN Layer

The API sits behind Cloudflare in caching mode. Configuration:

- **Cache behavior:** GET responses with `Cache-Control` headers are cached at edge nodes.
- **Cache key:** URL + query string. The `Origin` header is **not** included in the cache key by default.
- **Implication:** Without `Vary: Origin` in the API response, Cloudflare will serve the same cached response regardless of the requesting origin. This means a response with `Access-Control-Allow-Origin: https://app.example.com` could be served to a request from `https://admin.example.com`, or vice versa.

## Health Check Endpoint

The `/health` endpoint is polled by the internal load balancer every 5 seconds.

- **Purpose:** Internal liveness probe only.
- **Access:** Called from the private network by the load balancer. Not browser-accessible.
- **CORS:** The `/health` endpoint must **not** include CORS headers. It is an internal endpoint. Adding CORS headers to `/health` would allow cross-origin scripts to probe the API's internal health status, which is an information disclosure risk.
- **Response format:** `{"status": "ok", "timestamp": "<ISO 8601>"}` with HTTP 200.

## Preflight Handling

The API must respond to `OPTIONS` requests with:

- HTTP status `204 No Content`
- Appropriate CORS headers (origin, methods, headers, credentials, max-age)
- No response body

This is the standard pattern for CORS preflight responses.

## Request Flow

```
Browser (app.example.com)
  → Cloudflare CDN (edge cache)
    → Load Balancer (/health checks)
      → API Server (api.example.com)
```
