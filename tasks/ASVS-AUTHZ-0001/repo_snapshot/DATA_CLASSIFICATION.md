# Data Classification: Project Entity

## Field Classifications

| Field         | Classification | Visibility                        | Editability                          |
|---------------|---------------|-----------------------------------|--------------------------------------|
| `projectId`   | System        | All tenant members                | Never editable                       |
| `tenantId`    | System        | Never exposed in API responses    | Never editable                       |
| `name`        | Internal      | All tenant members                | `project_manager`, `admin`           |
| `description` | Internal      | All tenant members                | `project_manager`, `admin`           |
| `status`      | Internal      | All tenant members                | `developer`, `project_manager`, `admin` |
| `billingCode` | Confidential  | `project_manager`, `admin`        | `admin` ONLY                         |
| `createdBy`   | Internal      | All tenant members                | Read-only (never editable)           |

## Notes

- `billingCode` controls billing routing to the customer's internal cost centers. Unauthorized changes could redirect charges to the wrong department. Only `admin` users may modify this field.
- `tenantId` is a system field used for data isolation. It must never appear in API responses and must never be editable through any endpoint.
- `createdBy` is an audit field set at creation time. It must not be modifiable after the project is created.
