# Phase 11 — 手動テスト evidence（NON_VISUAL）

| 項目 | 値 |
| --- | --- |
| workflow_state | implemented_local_evidence_captured（guard test 実装済み） |
| visualEvidence | NON_VISUAL |
| evidence 区分 | local focused test evidence captured |

## 本サイクルの evidence 状態

本ワークフローは**実装仕様書 + guard test 実装**サイクルであり、コード実装（`wrangler-cron-schedule.guard.spec.ts`）は
本サイクルで完了した。したがって Phase 11 の primary evidence は**focused Vitest PASS**である。

NON_VISUAL タスクのため screenshot は不要。compliance check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）
の `Phase 11 evidence file inventory` は実在する 4 ファイル（本ファイル / manual-smoke-log / link-checklist / focused-vitest-local.txt）で satisfy する。

## 本サイクルで present へ昇格した evidence

| Classification | Path | 取得コマンド / 状態 |
| --- | --- | --- |
| focused test result | outputs/phase-11/focused-vitest-local.txt | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` / 16 tests PASS |
| package-script regression | outputs/phase-11/focused-vitest-local.txt | `mise exec -- pnpm --filter @ubm-hyogo/api test -- wrangler-cron-schedule` / apps/api 76 files, 481 tests PASS |
| runtime spot-check（任意 / Gate-C） | outputs/phase-11/staging-cron-tail.txt | user-gated optional; required evidence ではない |

> 無料枠予算は**解析的に確定**しているため、原 issue #264 AC-1/AC-2 の「24h staging 実測」は不要（supersede）。
