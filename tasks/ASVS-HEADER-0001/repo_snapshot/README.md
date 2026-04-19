# InternalDash — Security Headers Module

Lightweight internal dashboard tool serving ~200 employees. Recently moved behind a Cloudflare reverse proxy as part of infrastructure consolidation.

## Current State

After the proxy migration, NGINX was decommissioned. The application server must now set all security response headers itself. Some headers are missing and the X-Frame-Options header has the wrong value (carried over from the old NGINX config).

## Key Documents

- `PROXY_MIGRATION.md` — Cloudflare proxy details, IP ranges, header delegation
- `SECURITY_BASELINE.md` — Required security headers and their correct values
- `NGINX_LEGACY_CONFIG.md` — What NGINX used to set (for reference only)

## Module API

- `headers.applyHeaders(req, res, options)` — Set security headers on the response. `options.authenticated` indicates whether the response contains sensitive/authenticated data.
- `headers.getTrustedClientIP(req)` — Extract the real client IP from the request, accounting for the reverse proxy.

## Architecture

```
Client --> Cloudflare (TLS termination) --> App Server (port 3000)
```

Cloudflare terminates TLS and forwards requests. The app server handles all application logic and must set its own security response headers.
