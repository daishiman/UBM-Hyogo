# Issue #776 Schema Alias Bulk Resolve Lessons（2026-05）

unresolved schema diff の admin bulk resolve 化（serial-05-step-03-followup-002 を消費）で得た判断軸を、同種ケース（複数行を 1 操作で適用する admin UI / 既存単一 endpoint を温存する fan-out / partial failure の UX）で再利用できる粒度で残す。

## L-ISSUE-776-001: API 不変条件下では client-side bounded fan-out を選ぶ

CLAUDE.md 不変条件 1（`apps/api/src/routes/` の現行 endpoint surface のみ利用、新 endpoint 追加禁止）が active な間、bulk 操作は新 batch endpoint ではなく **client 側 bounded fan-out** で実装する。`apps/web/src/lib/admin/api.ts` の `postSchemaAliasBulk` は `postSchemaAlias` を loop し、行ごとの結果を `SchemaAliasBulkRowResult` union で返す。D1 schema / API contract は変更しない。

> サーバ側 batch を選ぶ判断境界: Phase 9 で 30s NFR 未達の実測 evidence が得られた時のみ formalize（implementation-guide.md §Known Limits）。

## L-ISSUE-776-002: bulk と single の state は完全に分離する

`SchemaDiffPanel` に bulk state を直接持たせると single-resolve（inline edit）経路と競合する。`useSchemaDiffBulkSelection` hook に `selectedIds` / `modalOpen` / `rows` / `isSubmitting` を閉じ込め、SchemaDiffPanel 側は toggle / checkbox / modal mount の最小差分だけにする。既存 single path には触らない。

## L-ISSUE-776-003: partial failure は first-class behavior として扱う

bulk 操作の 1 行失敗は throw しない。bounded row runner が controlling primitive で、hook は row-level result を modal へ逐次返す。成功行は committed として扱い（既存 endpoint が 1 alias / request で commit するため）、失敗行は `role="alert"` で modal 内に残し、`stableKey` 入力を編集可能に保つ。modal を閉じる条件は all-success のみ。

## L-ISSUE-776-004: `202 backfill_cpu_budget_exhausted` は failure ではなく retryable continuation

`202` は L-UT07B-H-003 の retryable continuation contract を踏襲し、`SchemaAliasBulkRowResult.status="retryable"` にマップする。modal の文言は failure ではなく restart 系（再操作で続行可能）にする。`isSchemaAliasRetryableContinuation` guard で 409/422/network/other と明示的に 5 値分離する。

| HTTP / 例外 | status | error.kind |
| --- | --- | --- |
| 2xx | `success` | — |
| 202 + `backfill_cpu_budget_exhausted` | `retryable` | `retryable` |
| 409 | `error` | `conflict` |
| 422 | `error` | `invalid` |
| throw / network reject | `error` | `network` |
| その他 non-2xx | `error` | `other` |

## L-ISSUE-776-005: validation rule は単一ファイルに集約する

`STABLE_KEY_PATTERN` を `apps/web/src/components/admin/schemaAliasValidation.ts` に置き、single / bulk 両経路から import する。regex を component 内に重複定義すると `lessons-learned-03a-stablekey-literal-lint-enforcement-2026-05.md` の lint gate と乖離する。bulk 追加時に重複が再発しやすいので新規 helper を生やす前にここを最初に grep する。

## L-ISSUE-776-006: Phase 11 evidence は local 単独でも canonical 構成を満たす

`apps/web/playwright/tests/issue776-schema-bulk-resolve.spec.ts` で 6 PNG（desktop/mobile × select/modal/partial-failure/success の組み合わせ）+ `perf-30rows.md` + `a11y-manual-check.md` を `outputs/phase-11/` に出す。staging credentials なしでも Phase 11 evidence existence validator は PASS する。staging smoke は user-gated として boundary に明記し、Phase 12 は `implemented_local_evidence_captured / VISUAL / staging_pending` で昇格する。

## L-ISSUE-776-007: source unassigned task は Phase 12 で必ず consumed 化

`docs/30-workflows/unassigned-task/serial-05-step-03-followup-002-schema-alias-bulk-resolve.md` と、親 workflow の `outputs/phase-12/unassigned-task-detection.md §3` を **同一 wave** で `consumed (Issue #776)` に書き換える。skill-feedback-report の routing 表で「Source unassigned task not consumed」を no-op として閉じるには両方の trace が必須。片側だけ更新すると Phase 12 strict compliance check で逸脱する。

## クロスリファレンス

- [[lessons-learned-ut07b-schema-alias-hardening-2026-05]] — 202 retryable contract / collision 二段防御の上位前提
- [[lessons-learned-03a-stablekey-literal-lint-enforcement-2026-05]] — STABLE_KEY 文字列の lint gate
- [[lessons-learned-issue-191-schema-aliases-2026-04]] — schema_aliases を primary write target にした経緯
- [[workflow-issue-776-schema-alias-bulk-resolve-artifact-inventory]] — 本 workflow の artifact ledger
