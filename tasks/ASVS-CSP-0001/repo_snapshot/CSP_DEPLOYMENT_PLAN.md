# CSP Re-Enablement Plan

## Background

After the CDN migration on 2026-02-20, the Content Security Policy header was removed entirely because it broke inline analytics scripts. This left the site vulnerable to XSS and other injection attacks. We need to re-enable CSP in a controlled, phased manner.

## Phased Rollout

### Phase 1 (this PR): Report-Only Mode

Deploy CSP as `Content-Security-Policy-Report-Only`, **NOT** `Content-Security-Policy`. This allows us to monitor violations without breaking the site. After 2 weeks of clean reports, we move to enforcing mode.

### Phase 2 (Week 3): Switch to Enforcing Mode

Change the header from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`. By this point we will have resolved any violations found during the report-only period.

## Inline Script Handling

Use CSP nonces for inline scripts. Generate a unique `nonce-<base64value>` per request. Add the nonce to the CSP `script-src` directive. The HTML rendering must include `nonce="<value>"` on inline `<script>` tags.

- Do **NOT** use `'unsafe-inline'` — this defeats the purpose of CSP against XSS.
- Do **NOT** use `'unsafe-eval'` — no inline eval is needed.

## CDN Integration

Static assets are served from `https://cdn.mediapub.com`. The CSP must allow this domain in `script-src`, `style-src`, and `img-src`.

## Report URI

CSP violations should be reported to `https://csp-reports.mediapub.com/report`. Set the `report-uri` directive.

## Anti-Clickjacking

Set `frame-ancestors 'self'` to prevent framing by other sites. This replaces the `X-Frame-Options` header (which the middleware already sets, but CSP's `frame-ancestors` is more flexible and takes precedence in modern browsers).

## Base URI Restriction

Set `base-uri 'self'` to prevent base tag injection attacks.

## Default Policy

`default-src 'self'`
