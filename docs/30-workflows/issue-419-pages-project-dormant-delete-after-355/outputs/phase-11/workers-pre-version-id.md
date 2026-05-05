# Workers Pre-Deletion VERSION_ID

state: PENDING_RUNTIME_EXECUTION
date: -
operator: -
redaction: -
runtime_pass: PENDING
ac_link: AC-1

## Required Runtime Evidence

Record the current and previous Workers production VERSION_ID values before deleting the dormant Pages project.

| Field | Value |
| --- | --- |
| command | `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production` |
| current_version_id | - |
| previous_version_id | - |
| rollback_command | `bash scripts/cf.sh rollback <VERSION_ID>` |

## PASS Criteria

- The VERSION_ID values are copied from a fresh production deployments list.
- The rollback target remains available after Pages deletion.
