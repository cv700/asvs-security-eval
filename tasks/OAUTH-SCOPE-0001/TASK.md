Fix the scope validation for this API platform's OAuth service.

Third-party applications are receiving 400 errors because they still send the old scope format (read, write, admin). The platform is migrating to fine-grained scopes but needs backward compatibility during the transition. Review the scope migration plan and deprecation policy, then update scope-service.js to handle both old and new scope formats.

Modify only scope-service.js. Do not change tests or other files.
