# Web CD Deploy Log Evidence Contract

## Status

`PENDING_IMPLEMENTATION_FOLLOW_UP`

## Boundary

This spec-created workflow does not run GitHub Actions, deploy to Cloudflare, or claim staging / production runtime PASS. The real deploy log must be captured by `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` or its promoted implementation workflow.

## Required Evidence On Execution

| Item | Required value |
| --- | --- |
| Workflow file | `.github/workflows/web-cd.yml` |
| Deploy command | `wrangler deploy --env staging` and, after approval, `wrangler deploy --env production` |
| Link form | `Refs #355` |
| Failure boundary | Any Pages deploy command or missing manual approval is NO-GO |

