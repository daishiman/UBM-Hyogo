# Issue #504 UT-07B-FU-01 Extended Fixture 50k Stress Trial Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| task_id | issue-504-ut-07b-fu-01-followup-extended-fixture-50k |
| workflow root | `docs/30-workflows/completed-tasks/issue-504-ut-07b-fu-01-followup-extended-fixture-50k/` |
| status | spec_created / implementation / NON_VISUAL / staging stress trial user-gated |
| issue | #504 CLOSED / PR text must use `Refs #504` |
| parent | UT-07B-FU-01 (`docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/`) |

## Workflow Artifacts

| Area | Paths |
| --- | --- |
| root docs | `index.md`, `phase-01.md` ... `phase-13.md`, `artifacts.json` |
| outputs ledger | `outputs/artifacts.json` |
| Phase 1-10 outputs | `outputs/phase-1/` ... `outputs/phase-10/` (design / spec / implementation guidance) |
| Phase 11 gate | `outputs/phase-11/main.md`, `outputs/phase-11/gate-decision.md`, `outputs/phase-11/dry-run-release-notes.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md` |
| Phase 12 evidence (strict 7) | `outputs/phase-12/main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md` |
| Phase 12 review | `outputs/phase-12/elegant-review-30.md` |
| Phase 13 outputs | `outputs/phase-13/` |

## Contract Summary

| Contract | Value |
| --- | --- |
| fixture identity prefix | `dedupe_key` LIKE `ubm-test-fixture-50k-%` |
| cleanup selector | `dedupe_key LIKE 'ubm-test-fixture-50k-%'` (prefix-only; never broad) |
| trial count | 10 trials per stress run |
| abort gates | `retry_count <= 3`, `dlq_count = 0`, `cpu_ms <= 250000`, timeout `1800s` |
| trigger endpoint | `POST /admin/schema/backfill/trigger` (requires `Authorization: Bearer ${ADMIN_SESSION_JWT}`) |
| environment scope | staging D1 only; production bulk `INSERT` / `DELETE` is permanent ban |
| evidence | per-trial JSON ledger emitted by `run-stress-trial.sh` |
| keywords | issue-504, 50k-fixture, stress-trial-50k, extended-fixture-50k, schema-alias-backfill |

## Runtime Boundary

No staging D1 write, Cloudflare Queue runtime, production migration apply, deploy, commit, push, PR creation, or Issue #504 comment is executed by the spec_created close-out. Staging stress trial, fixture seed/cleanup, and trigger invocation remain user-gated and require explicit operator approval.

## Code Artifacts

| File | Purpose |
| --- | --- |
| `scripts/schema-alias-backfill/generate-50k-fixture.ts` | Deterministic 50k fixture generator emitting `ubm-test-fixture-50k-<n>` `dedupe_key` rows |
| `scripts/schema-alias-backfill/seed-staging-50k.sh` | Staging-only seed driver invoking the generator and idempotent INSERT into staging D1 |
| `scripts/schema-alias-backfill/cleanup-staging-50k.sh` | Staging-only cleanup using prefix `dedupe_key LIKE 'ubm-test-fixture-50k-%'` selector |
| `scripts/schema-alias-backfill/run-stress-trial.sh` | 10-trial driver: trigger backfill, capture evidence JSON, enforce abort thresholds |
| `scripts/schema-alias-backfill/__tests__/` | vitest / bats tests covering generator determinism, prefix selector, abort threshold parsing |
| `apps/api/src/routes/admin/schema.ts` | `POST /admin/schema/backfill/trigger` endpoint with double fail-closed: production env reject + ADMIN_SESSION_JWT verification |
| `apps/api/src/routes/admin/_shared.ts` | Shared admin route helpers (session verification, env gating) |

## Implementation Guide Pointers

| Pointer | Path |
| --- | --- |
| Phase 12 implementation guide | `docs/30-workflows/completed-tasks/issue-504-ut-07b-fu-01-followup-extended-fixture-50k/outputs/phase-12/implementation-guide.md` |
| System spec update summary | `docs/30-workflows/completed-tasks/issue-504-ut-07b-fu-01-followup-extended-fixture-50k/outputs/phase-12/system-spec-update-summary.md` |
| Documentation changelog | `docs/30-workflows/completed-tasks/issue-504-ut-07b-fu-01-followup-extended-fixture-50k/outputs/phase-12/documentation-changelog.md` |
| Phase 12 strict compliance | `docs/30-workflows/completed-tasks/issue-504-ut-07b-fu-01-followup-extended-fixture-50k/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Elegant review (30) | `docs/30-workflows/completed-tasks/issue-504-ut-07b-fu-01-followup-extended-fixture-50k/outputs/phase-12/elegant-review-30.md` |
| Runbook SSOT | `.claude/skills/aiworkflow-requirements/references/schema-alias-backfill-runbook.md` |

## Unassigned Task Trace

| Task spec | Path | Status |
| --- | --- | --- |
| Parent task spec | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-extended-fixture-50k.md` | consumed; formalized as Issue #504 standalone workflow |
| Sibling: DLQ monitoring dashboard | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` | follow-up; gated on Cloudflare Queue/DLQ runtime evidence |
| Sibling: Cursor semantics migration | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` | follow-up; gated on remaining-scan degradation observation |
| Parent inventory cross-ref | `references/workflow-ut-07b-fu-01-schema-alias-backfill-queue-cron-split-artifact-inventory.md` | parent UT-07B-FU-01 artifact inventory |

## Lessons Learned

苦戦箇所と適用ルールは `references/lessons-learned-ut07b-fu-01-schema-alias-backfill-queue-cron-split-2026-05.md` 末尾の L-UT07B-FU01-007〜010 を参照（L-007 prefix `dedupe_key` cleanup selector 厳守 / L-008 production env + ADMIN_SESSION_JWT の二重 fail-closed / L-009 trigger は curl + Bearer ADMIN_SESSION_JWT 経路に固定 / L-010 親 workflow root の `test -f` ガードによる artifact lookup）。
