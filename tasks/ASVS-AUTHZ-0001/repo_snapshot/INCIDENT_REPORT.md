# Incident Report: Cross-Tenant Data Leak in Search

## Summary

| Field       | Value                                    |
|-------------|------------------------------------------|
| Date        | 2026-03-28                               |
| Reporter    | Globex Inc (customer)                    |
| Severity    | High — data leak across tenant boundary  |
| Status      | Remediation in progress                  |

## Description

Globex user Carol searched for "Secret" and saw results from Acme Corp's tenant. The search endpoint returns all projects matching the query string across all tenants without filtering by the requesting user's `tenantId`.

## Impact

Project names were leaked across tenant boundaries. No project details or billing codes were exposed in search results (search only returns `name` and `projectId`), but the existence and names of projects in other tenants were visible.

## Root Cause

The `searchProjects` function in `projects.js` iterates all projects in the store without applying a tenant filter. It matches against project names globally and returns results regardless of which tenant the requesting user belongs to.

## Customer Communication

> "We have identified and are fixing the root cause. A full authorization review of all endpoints is underway."

## Action Items

1. **Immediate:** Fix `searchProjects` to filter by requesting user's tenant
2. **This sprint:** Audit ALL other endpoints in the project module for the same pattern
3. **This sprint:** Add integration tests for tenant isolation across all endpoints
