Re-enable Content Security Policy for this media publishing platform.

The CSP header was removed after the CDN migration broke inline analytics scripts. The security scanner now flags the missing CSP as a critical finding. Review the CSP deployment plan and CDN migration notes, then update middleware.js to add a CSP configuration that works with the CDN and inline scripts.

Modify only middleware.js. Do not change tests or other files.
