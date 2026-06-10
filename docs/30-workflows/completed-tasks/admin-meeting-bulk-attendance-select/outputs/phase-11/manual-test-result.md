# Phase 11 Manual Test Result — admin-meeting-bulk-attendance-select

workflow_state: `implemented_local_evidence_captured` / generated_at: 2026-06-09

## テスト方式

本タスクは VISUAL の **apps/web 実装完了・local evidence captured** である。jsdom focused tests で
DOM 契約・件数文言・`committed:false` 境界を確認し、typecheck/lint/token gate も PASS 済み。
local fixture pixel screenshot 7 枚を取得済み。認証済み staging baseline は user-gated として残す。

## Summary

| Gate | Status | Evidence（実装後） |
| --- | --- | --- |
| Local focused vitest | PASS | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/components/_meetings/__tests__ apps/web/src/components/ui/__tests__/Checkbox.spec.tsx apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts`（10 files / 38 tests） |
| typecheck / lint / token | PASS | `mise exec -- pnpm typecheck`; `mise exec -- pnpm lint`; `mise exec -- pnpm verify:tokens` |
| Local fixture visual screenshot | PASS | `outputs/phase-11/screenshots/`（7 PNG: drawer closed / checklist / multi selected / search / modal / success toast / failure toast） |
| Staging visual screenshot | PENDING_STAGING_BASELINE | staging authenticated screenshots は user-gated |
| apps/api / packages unchanged | PASS | `git diff --name-only -- apps/api packages` が空（AC-12） |

## テストケースと PASS 観点（実装後に検証）

| TC | AC | 撮影予定 screenshot | PASS 観点 |
| --- | --- | --- | --- |
| TC-11-1 | — | `bulk-attendance-drawer-closed.png` | 開催日一覧が表示され、行クリックでドロワーが開く起点が分かる |
| TC-11-2 | AC-1/AC-4 | `bulk-attendance-checklist-expanded.png` | ドロワー内に未出席候補のチェックリストが表示。出席済は本リストに出ない |
| TC-11-3 | AC-1/AC-3 | `bulk-attendance-multi-selected.png` | 複数候補が `aria-checked=true` で選択強調。ボタンに件数 N が反映 |
| TC-11-4 | AC-2 | `bulk-attendance-search-filtered.png` | 会員名 / memberId でインクリメンタル絞込され候補が縮む |
| TC-11-5 | AC-8 | `bulk-attendance-modal-expanded.png` | 全画面モーダルが開き、検索 / 全選択 / 選択解除 / 一括追加を持つ |
| TC-11-6 | AC-6 | `bulk-attendance-success-toast.png` | `「N 名の出席を追加しました」` toast 表示・選択クリア |
| TC-11-7 | AC-7 | `bulk-attendance-failure-toast.png` | `committed:false` 時 attended 不変・失敗内訳 toast・選択保持 |

## Visual Runtime Boundary

チェックリストの横並び/縦リスト・選択強調・モーダル overlay・toast の tone は jsdom（focused vitest）では
レンダリング結果を保証できないため、local fixture pixel screenshot で補完した。認証済み staging の実データ
baseline は user-gated とする。DOM/state/API 境界は focused tests で PASS 済み。

## local evidence captured 境界

- 実装コード: `apps/web` のみ完了（Checkbox / bulk checklist / modal / selection hook / importAttendance / Shell state update）。
- screenshot 実体: 7 PNG 生成済み（`outputs/phase-11/screenshots/`）。
- focused vitest: 10 files / 38 tests PASS。
- 本ファイルの責務: local PASS evidence と staging visual pending 境界の記録。

## 参照資料

| 種別 | Path |
| --- | --- |
| Phase 11 手動テスト計画 | `../../phase-11-manual-test.md` |
| 撮影計画 | `screenshot-plan.json` |
| capture metadata | `phase11-capture-metadata.json` |
| 視覚レビュー計画 | `ui-sanity-visual-review.md` |
| SSOT | `../phase-1/shared-context.md` |
