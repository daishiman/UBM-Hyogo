# workflow-ut-25-deriv-02-sa-key-expiry-monitoring artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/` |
| root artifacts | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/artifacts.json` |
| output artifacts | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/artifacts.json` |
| Phase 11 inventory | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/phase-11-evidence-inventory.md` |
| Phase 11 placeholder | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source unassigned | `docs/30-workflows/unassigned-task/UT-25-DERIV-02-sa-key-expiry-monitoring.md` |
| rollback runbook | `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md` |
| classifier target | `apps/api/src/jobs/sheets-auth-classifier.ts` |
| logger target | `apps/api/src/jobs/sheets-auth-logger.ts` |
| healthcheck target | `apps/api/src/scheduled/sheets-auth-healthcheck.ts` |
| sync injection targets | `apps/api/src/sync/backfill.ts`, `apps/api/src/sync/manual.ts`, `apps/api/src/jobs/sync-sheets-to-d1.ts` |
| scheduled wiring | `apps/api/src/index.ts` |
| alert payload target | `apps/api/src/routes/internal/alert-relay.ts` |
| lessons learned | `.claude/skills/aiworkflow-requirements/lessons-learned/20260522-ut-25-deriv-02-sheets-auth-alert-dedup.md` |
| Phase 12 skill feedback | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-12/skill-feedback-report.md` |
| Phase 12 spec sync summary | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-12/system-spec-update-summary.md` |

## Contract

The workflow is `implemented_local_runtime_pending / implementation / NON_VISUAL`.
It defines Sheets API 401/403 classification and alerting for the existing
`GOOGLE_SERVICE_ACCOUNT_JSON` secret without adding a new cron trigger.

Runtime operations remain user-gated: staging secret invalidation, Workers tail,
staging/prod deploy, commit, push, and PR.
