# Third-Party Client Registry

## Client Inventory

| Client ID | Name | Scope Usage | Active Users | Migration Status |
|-----------|------|-------------|-------------|-----------------|
| `app_legacy_001` | LegacyApp | `scope=read write` | 500 | Owner contacted, migration planned for Q3 |
| `app_modern_002` | ModernApp | New scopes (`projects:read users:read`) | 120 | Complete — no action needed |
| `app_admin_003` | AdminTool | `scope=admin` | 5 | Internal tool, migration in progress |

12 additional clients use old scope format — not listed individually but follow the same patterns as `app_legacy_001`.

## Notes

- LegacyApp is the highest-traffic client still using old scopes. Breakage here affects 500 users.
- AdminTool uses the `admin` scope but is an internal tool with limited blast radius.
- ModernApp has already completed migration and requires no changes.
