# Phase 11 Manual Test Result — issue-838-schema-alias-rollback-notification

## Status

`local_evidence_captured_runtime_pending`

## Local Evidence

| Evidence | Command | Result |
| --- | --- | --- |
| focused unit + route tests | `pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts` | PASS: 2 files, 13 tests |
| typecheck | `pnpm --filter @ubm-hyogo/api typecheck` | PASS |

## Runtime Boundary

Staging rollback smoke and real Slack/mail provider delivery are user-gated runtime operations. No Cloudflare secret mutation, deploy, D1 staging mutation, commit, push, or PR was executed in this cycle.

## Redaction Check

Local tests verify that notification payloads do not include raw actor email, stableKey, or webhook/provider URL material. The audit entry stores only `{ status, channel, attempts, errorClass, dispatchedAt }` in `after_json`.
