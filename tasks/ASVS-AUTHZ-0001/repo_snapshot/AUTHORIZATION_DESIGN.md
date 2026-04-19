# Multi-Tenant Authorization Design

## Overview

ProjectVault is a multi-tenant SaaS application. Each customer organization is a tenant. Users belong to exactly one tenant and must never see or modify data belonging to another tenant.

## Authorization Principles

### Principle 1: Query-Level Isolation

All data access queries MUST include the requesting user's `tenantId` as a filter condition. Do not fetch all data and filter afterward — this prevents accidental leakage if filtering logic has bugs.

### Principle 2: Resource-Level Ownership

Any endpoint that accepts a resource ID (e.g., `projectId`) must verify the resource belongs to the requesting user's tenant BEFORE returning any data or performing any action. This applies to GET, PATCH/PUT, and DELETE operations.

### Principle 3: Field-Level Authorization

Not all fields on a resource are equally sensitive. Update permissions are role-dependent:

- **`admin`** role can update: ALL fields including `billingCode`
- **`project_manager`** role can update: `name`, `description`, `status`
- **`developer`** role can update: `status` only

Only the `admin` role can update `billingCode` — this field controls billing routing and must be restricted. Attempting to update a field outside the user's role permissions must be rejected.

### Principle 4: Error Opacity

When a user attempts to access a resource in another tenant, the response must be "Not found" (404 semantics), NOT "Forbidden" (403 semantics). Returning 403 reveals that the resource exists in another tenant, which is itself an information leak.

The user should not be able to distinguish between:
- "This resource does not exist"
- "This resource exists but belongs to another tenant"

Both cases must produce the same error response.

### Principle 5: Delete Authorization

Only `project_manager` and `admin` roles can delete projects. The `developer` role does not have delete permissions.

## Role Hierarchy

| Role              | Read own tenant | Update fields       | Delete | Manage billing |
|-------------------|-----------------|---------------------|--------|----------------|
| `developer`       | Yes             | `status` only       | No     | No             |
| `project_manager` | Yes             | `name`, `description`, `status` | Yes | No        |
| `admin`           | Yes             | All fields          | Yes    | Yes            |
