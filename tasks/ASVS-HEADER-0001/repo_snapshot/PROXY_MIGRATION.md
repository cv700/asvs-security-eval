# Proxy Migration Notes

## Overview

InternalDash has been moved behind a Cloudflare reverse proxy. Cloudflare terminates TLS and forwards traffic to the application server on port 3000 over plain HTTP within our private network.

## NGINX Decommission

NGINX has been fully removed from the request path. The application server must now set **all** security response headers itself. Any headers that NGINX previously added are no longer being applied.

## Cloudflare Behavior

- Cloudflare adds its own headers to proxied requests: `cf-ray`, `cf-connecting-ip`, `cf-ipcountry`.
- Cloudflare sets `X-Forwarded-For` on forwarded requests with the real client IP.
- Cloudflare does **NOT** add security response headers (X-Frame-Options, HSTS, etc.). These must be set by the origin server.

## Cloudflare IP Ranges

The following are the current Cloudflare IPv4 ranges. Requests arriving at the app server with a `remoteAddress` in one of these ranges are coming through the Cloudflare proxy.

- 173.245.48.0/20
- 103.21.244.0/22
- 103.22.200.0/22
- 103.31.4.0/22
- 141.101.64.0/18
- 108.162.192.0/18
- 190.93.240.0/20
- 188.114.96.0/20
- 197.234.240.0/22
- 198.41.128.0/17
- 162.158.0.0/15
- 104.16.0.0/13
- 104.24.0.0/14
- 172.64.0.0/13
- 131.0.72.0/22

## X-Forwarded-For Trust

**IMPORTANT:** The `X-Forwarded-For` header must only be trusted if the direct connection (`remoteAddress`) comes from a Cloudflare IP range listed above. If the request comes from a non-Cloudflare IP, the `X-Forwarded-For` header could be spoofed by anyone — use the `remoteAddress` directly as the client IP.

This is critical for audit logging. If an attacker connects directly to port 3000 (bypassing Cloudflare), they could set `X-Forwarded-For` to any value. We must not trust it in that case.
