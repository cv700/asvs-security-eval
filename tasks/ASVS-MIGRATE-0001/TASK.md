Fix the authentication module in this application.

Login is broken for users who have already been migrated to the new password hashing format. Review the migration plan and security audit in the repository, then update auth.js to support the ongoing password storage migration.

Modify only auth.js. Do not change tests or hidden harness files.
