# UT-07B-FU-01 Schema Alias Back-fill Queue/Cron Split Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| task_id | UT-07B-FU-01 |
| workflow root | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/` |
| status | implemented-local / implementation / NON_VISUAL / Phase 12 strict outputs present / local implementation GO / runtime evidence pending |
| issue | #361 CLOSED / PR text must use `Refs #361` |
| parent | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/` |

## Workflow Artifacts

| Area | Paths |
| --- | --- |
| root docs | `index.md`, `phase-01.md` ... `phase-13.md`, `artifacts.json` |
| outputs ledger | `outputs/artifacts.json` |
| Phase 11 gate | `outputs/phase-11/main.md`, `outputs/phase-11/gate-decision.md` |
| Phase 12 evidence | `outputs/phase-12/main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md` |

## Contract Summary

| Contract | Value |
| --- | --- |
| phase10_gate | `design-ready` only |
| phase11_gate | `local implementation GO` / runtime `GO` / `NO-GO` / `staging-deferred` |
| public backfill.status | `pending` / `running` / `exhausted` / `completed` |
| internal DB extension | `dedupe_key`, `failed_items_json`, `retry_count`, `last_error`, `last_processed_at` |
| batch model | remaining-scan |
| keywords | UT-07B-FU-01, ut-07b-fu-01-schema-alias-backfill-queue-cron-split, backfill_continuation, confirmed_status, Queue, Cron |

## Runtime Boundary

No staging evidence, Cloudflare Queue/DLQ creation, deploy, commit, push, PR, production migration apply, or Issue #361 comment is executed by the implemented-local close-out. Runtime evidence remains user-gated.

## Code Artifacts

| File | Purpose |
| --- | --- |
| `apps/api/src/workflows/schemaAliasEnqueue.ts` | Cron-driven Queue producer: dedupe_key 予約と `producer.send` を担当する軽量 enqueue 経路 |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | Queue consumer / Cron batch continuation: remaining-scan + idempotent UPDATE + retry counter |
| `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | `schema_diff_queue` への `dedupe_key` / `failed_items_json` / `retry_count` / `last_error` / `last_processed_at` 追加とユニーク制約 |
| `apps/api/wrangler.toml` | enqueue 用 cron（軽量・短間隔）と batch 用 cron（重量・長間隔）の分離 + `SCHEMA_ALIAS_BACKFILL_QUEUE` binding |
| `apps/api/src/index.ts` | Cloudflare Queue consumer shim（`queue()` ハンドラ）を Hono app に橋渡し |
| `apps/api/src/repository/schemaDiffQueue.ts` | dedupe / retry / failed item / remaining-scan 用 repository helpers |
| `apps/api/src/routes/admin/schema.ts` | `confirmed` フィールドと `backfill.status` フィールドを分離した v2 contract、internal failure を public `exhausted` + metadata に変換 |
| `apps/api/src/env.ts` | `SCHEMA_ALIAS_BACKFILL_QUEUE` Queue binding 型定義の追加 |

## Implementation Guide Pointers

| Pointer | Path |
| --- | --- |
| Phase 12 implementation guide | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/implementation-guide.md` |
| System spec update summary | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/system-spec-update-summary.md` |
| Documentation changelog | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/documentation-changelog.md` |
| Phase 12 strict compliance | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 11 gate decision | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/gate-decision.md` |

## Unassigned Task Trace

| Task spec | Path | Status |
| --- | --- | --- |
| Parent task spec | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-schema-alias-backfill-queue-cron-split.md` | parent seed; consumed by current workflow root |
| Follow-up: DLQ monitoring dashboard | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` | formalized as standalone follow-up; gated on runtime evidence (Cloudflare Queue/DLQ creation + deploy 後) |
| Follow-up: Cursor semantics migration | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` | formalized as standalone follow-up; gated on remaining-scan 劣化観測 |
| Follow-up: Extended fixture 50k | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-extended-fixture-50k.md` | formalized as standalone follow-up; gated on Phase 11 staging evidence で 10,000+ rows persistent CPU budget exhaustion を確認した後 |

## Lessons Learned

苦戦箇所と適用ルールは `references/lessons-learned-ut07b-fu-01-schema-alias-backfill-queue-cron-split-2026-05.md` を参照（L-UT07B-FU01-001 Queue dedupe 二層 / L-002 Cron 分割と CPU budget / L-003 public-internal status 値域変換 / L-004 remaining-scan 選定 / L-005 consumer dedupe 再確認 / L-006 Phase 11 gate 文言）。
