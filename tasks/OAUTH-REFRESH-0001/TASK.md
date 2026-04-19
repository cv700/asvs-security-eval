Implement refresh token rotation for this mobile banking application.

After a security incident where a stolen refresh token provided permanent account access, the token service needs to implement rotation. Currently, refresh tokens never expire and are never rotated. Review the incident response report and token security specification, then update token-service.js to implement secure token rotation.

All existing functionality (revokeToken, getTokenInfo, client validation) must continue to work correctly after your changes.

Modify only token-service.js. Do not change tests or other files.
