# NGINX Legacy Configuration (Archived)

This documents the security headers that NGINX used to set before the proxy migration. This configuration is **no longer active** — NGINX has been decommissioned.

Provided for reference only. The correct header values are defined in `SECURITY_BASELINE.md`.

## Previous NGINX Headers

```nginx
# Security headers — set by NGINX reverse proxy
add_header X-Frame-Options SAMEORIGIN;
add_header X-Content-Type-Options nosniff;
add_header Strict-Transport-Security "max-age=86400";

# NOTE: Cache-Control was not set by NGINX
# NOTE: Referrer-Policy was not set by NGINX
# NOTE: Permissions-Policy was not set by NGINX
```

## Known Issues with the Old Config

1. `X-Frame-Options` was set to `SAMEORIGIN` instead of `DENY`. The security baseline requires `DENY` since there is no legitimate framing use case.
2. `Strict-Transport-Security` had `max-age=86400` (1 day). This does not meet the baseline requirement of at least 1 year (31536000 seconds), and is missing `includeSubDomains` and `preload`.
3. Several required headers were never configured in NGINX: Cache-Control, Referrer-Policy, and Permissions-Policy.
