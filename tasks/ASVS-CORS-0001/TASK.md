Fix the CORS configuration for this REST API.

The frontend team deployed a new React SPA on app.example.com, but API calls to api.example.com are blocked by the browser's same-origin policy. Review the CORS policy and API gateway specification, then update server.js to enable cross-origin requests for the new frontend.

All existing functionality (createTestServer, route handling, parseBody, sendJSON) must continue to work correctly after your changes. Focus your edits on the handleCORS function and any supporting constants it needs. Do not change the existing require() statements — the server uses node:http and ./routes, which are correct. Do not restructure the server.

Modify only server.js. Do not change routes, tests, or other files.
