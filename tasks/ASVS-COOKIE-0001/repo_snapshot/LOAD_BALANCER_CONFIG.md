# Load Balancer Configuration

## TLS Termination

- **Provider:** Cloudflare
- **TLS termination:** At the edge (Cloudflare handles HTTPS)
- **Backend protocol:** HTTP on port 3000
- **Forwarded header:** `X-Forwarded-Proto: https` is set by Cloudflare on all requests

## Cookie Behavior

The `Secure` flag on cookies is valid even though the application server receives HTTP traffic. The browser evaluates cookie attributes based on the original connection (HTTPS via Cloudflare), not the backend hop.

This means:
- Setting `Secure` on cookies will NOT prevent them from being set — the browser sees HTTPS
- The `__Host-` prefix will work correctly because the browser sees an HTTPS origin

## Health Check

The `/health` endpoint is called by the internal monitoring system over plain HTTP. No session cookie should be set on health check responses.

## Request Flow

```
Browser --[HTTPS]--> Cloudflare --[HTTP]--> App Server (port 3000)
                     (TLS termination)       (X-Forwarded-Proto: https)
```
