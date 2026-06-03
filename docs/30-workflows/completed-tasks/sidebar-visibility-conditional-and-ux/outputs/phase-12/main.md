# Phase 12: Documentation

## Summary

本パッケージは本ワークフロー（サイドバー表示条件の正本化 + SSR active 正確化 + viewer/active/badge UX）の
Phase 12 成果物である。workflow_state は `implemented_local_evidence_captured / implementation / VISUAL`。
Phase 1-13 の仕様作成に加えて、実コード（`(auth)` route group 移動 / middleware `x-pathname` 注入 /
admin layout `activePath` 正確化 / viewer identity / active 視認性）・focused vitest・typecheck・lint まで完了した。
pixel screenshot・commit・push・PR は **user-gated** に残す。

本件は **実装仕様書**（route topology / middleware / shell コンポーネントへのコード変更を伴う）。正本仕様 09h §1.6 の
「`/login`=shell 外 bare」へ実装を一致させ、マトリクスへ `(auth)` route group を明示した **system spec 同期 Step 2 該当** である。

## Strict 7 Outputs

| File | Purpose | Status |
| --- | --- | --- |
| `main.md` | Phase 12 entrypoint | present |
| `implementation-guide.md` | Part 1（例え話）/ Part 2（技術） | present |
| `system-spec-update-summary.md` | 09h §1.6 へ `(auth)` 反映（Step 2 該当） | present |
| `documentation-changelog.md` | 全 Step 結果（該当なしも記録） | present |
| `unassigned-task-detection.md` | 未タスク検出（0 件・MINOR-1/2/3 境界記録） | present |
| `skill-feedback-report.md` | skill / template / docs feedback | present |
| `phase12-task-spec-compliance-check.md` | canonical 9 見出し compliance gate | present |

## Boundary

| Boundary | Status |
| --- | --- |
| Phase 1-13 仕様 | present |
| apps/web 実コード（`(auth)` 移動 / middleware x-pathname / admin activePath / viewer identity / active 視認性） | completed |
| direct focused vitest / typecheck / lint（AC-9） | PASS（20 files / 98 tests） |
| local pixel screenshots | present（4 PNG: `/login`, viewer desktop/mobile, mobile drawer） |
| staging/admin pixel screenshots | pending（staging 認証 user-gated） |
| staging visual baseline | pending（user-gated） |
| commit / push / PR | pending（user-gated） |
