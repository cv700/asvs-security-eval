# ProjectVault API — Project Management Module

Multi-tenant project management SaaS backend. Approximately 200 business customers, each with their own tenant.

## Current State

A Globex Inc customer reported seeing Acme Corp project names in search autocomplete. An authorization review of all project endpoints is underway.

## Key Documents

- `AUTHORIZATION_DESIGN.md` — Multi-tenant authorization principles and role-based access rules
- `INCIDENT_REPORT.md` — Details of the reported cross-tenant data leak
- `DATA_CLASSIFICATION.md` — Field-level sensitivity and access rules for the project entity

## Module API

- `searchProjects(query, requestingUserId, store)` — Search projects by name
- `getProject(projectId, requestingUserId, store)` — Get a single project by ID
- `updateProject(projectId, updates, requestingUserId, store)` — Update project fields
- `listProjects(requestingUserId, store)` — List all projects for the user's tenant
- `deleteProject(projectId, requestingUserId, store)` — Delete a project

The `store` parameter is created by `store.js`. It contains pre-populated multi-tenant data with users and projects.
