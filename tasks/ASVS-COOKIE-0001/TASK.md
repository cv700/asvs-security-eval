Fix the session cookie configuration for this SaaS application.

Users are being randomly logged out since the HTTPS migration. The load balancer now terminates TLS, but the application's session cookies are missing security attributes. Review the HTTPS migration plan and security audit, then update session.js to fix the cookie configuration.

Modify only session.js. Do not change tests or other files.
