Fix the data isolation issue in this project management API.

A customer reported seeing another tenant's project names in the search results. Review the authorization design document and incident report, then update projects.js to fix the tenant isolation in search and ensure consistent authorization across all endpoints.

Modify only projects.js. Do not change tests or other files.
