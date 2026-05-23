# System Spec Update Summary

| Area | Update |
| --- | --- |
| Deployment secrets | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` now links the SA key rotation SOP. |
| Workflow inventory | aiworkflow quick-reference, resource-map, task-workflow-active, and artifact inventory now register this workflow. |
| Runtime app | `apps/api/src/routes/admin/smoke-sheets.ts` now validates the canonical `GOOGLE_SERVICE_ACCOUNT_JSON` secret first and supports user-gated production smoke via `SMOKE_SHEETS_ALLOW_PRODUCTION=true`. |
| External operations | Cloudflare Secret mutation and Google IAM key disable/delete are user-gated. |
