Fix the security headers for this internal tool after the reverse proxy migration.

After moving behind a Cloudflare reverse proxy, some security headers are duplicated and others are missing. The duplicate X-Frame-Options header is causing browsers to ignore the directive entirely. Review the proxy migration notes and security baseline, then update headers.js to set all required security headers correctly.

Modify only headers.js. Do not change tests or other files.
