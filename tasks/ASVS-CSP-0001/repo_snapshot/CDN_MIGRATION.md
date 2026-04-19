# CDN Migration — February 2026

## Migration Details

- **CDN domain:** `https://cdn.mediapub.com`
- All JavaScript, CSS, and images are now served from the CDN
- CDN caches aggressively — CSP nonces are per-request, so HTML pages must not be cached by CDN
- The CDN also serves some third-party analytics scripts — these are loaded as external scripts, not inline

## Monitoring

- CSP violation reports should be sent to: `https://csp-reports.mediapub.com/report`
- This endpoint aggregates reports for the security dashboard

## Notes

- The internal `/health` endpoint is not browser-facing and should not have CSP applied
- Static asset URLs follow the pattern `https://cdn.mediapub.com/assets/...`
