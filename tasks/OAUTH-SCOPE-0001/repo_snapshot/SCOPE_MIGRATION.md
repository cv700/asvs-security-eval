# Scope Migration Plan

## Overview

Migrating from coarse-grained OAuth scopes to fine-grained scopes to support granular permission management across the API platform.

## Transition Period

12 months from migration start: **2026-01-01 to 2026-12-31**. During this period, old scope strings must be accepted and mapped to their new equivalents.

## Scope Mapping

Old scopes map to new equivalents as follows:

| Old Scope | New Equivalents |
|-----------|----------------|
| `read`    | `projects:read`, `users:read`, `billing:read` |
| `write`   | `projects:read`, `projects:write`, `users:read`, `users:write` |
| `admin`   | All scopes (`projects:read`, `projects:write`, `users:read`, `users:write`, `billing:read`, `billing:admin`, `settings:admin`) |

## Token Format

Regardless of what the client requests, tokens MUST contain ONLY new scope strings. If a client requests `scope=read`, the token's scope field must be `projects:read users:read billing:read`, NOT `read`. This ensures downstream services only need to check new scope format.

## Scope Downgrade

If a client requests more scopes than it's approved for, issue the token with ONLY the intersection of requested and approved scopes. The response MUST include the `scope` field reflecting actual granted scopes (per RFC 6749, this is required when granted scopes differ from requested).

For example, if `app_legacy_001` requests `admin` but is only approved for `read, write`, issue with the `write`-equivalent scopes only.

## Mixed Scope Requests

A client may send a mix of old and new scopes (e.g., `read projects:write`). Map any old scopes to new equivalents, then deduplicate.

## Deprecation Logging

When a client uses old scope format, log `{clientId, requestedScopes, mappedScopes, timestamp}` to the deprecation log. This helps track which clients still need migration.
