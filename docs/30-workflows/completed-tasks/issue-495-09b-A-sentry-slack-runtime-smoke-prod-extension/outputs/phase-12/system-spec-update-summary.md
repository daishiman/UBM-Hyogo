# System Spec Update Summary

## Updated Canonical Files

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Added production smoke extension contract: confirmation header, env-specific prefixes, Sentry environment tag, and G1-G4 runtime gate. |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Added production `SMOKE_ADMIN_TOKEN` and clarified same-name env-scoped Cloudflare Secrets. |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | Changed `SMOKE_ADMIN_TOKEN` from dev/staging-only to API smoke routes including production-gated observability smoke. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Registered this workflow as implemented-local implementation work with runtime evidence pending user approval. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added quick path for the production extension. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added workflow inventory row for the production extension. |

## Index Rebuild

`pnpm indexes:rebuild` is required after final reference edits. This cycle verifies with grep and reports command execution in the final summary.
