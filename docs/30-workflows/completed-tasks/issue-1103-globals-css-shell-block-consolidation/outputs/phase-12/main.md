# Phase 12 Main — issue-1103 globals.css 重複 shell ブロック 1 本化

## Summary

本 Phase 12 は、`apps/web/src/styles/globals.css` の byte-identical な `parallel-01 P1-1〜P1-5` 後発重複ブロック削除を `implemented_local_evidence_captured` として正本同期する。

変更対象は `apps/web/src/styles/globals.css` のみ。視覚カテゴリは `NON_VISUAL` で、理由は削除対象と残存対象が同一 `@layer components` 直下・@media 非内包で byte 完全一致しており、computed style が変わらないため。

## Strict 7 Inventory

| # | File | Status |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | present |
| 2 | `outputs/phase-12/implementation-guide.md` | present |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | present |
| 4 | `outputs/phase-12/documentation-changelog.md` | present |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | present |
| 6 | `outputs/phase-12/skill-feedback-report.md` | present |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## Local Evidence

Phase 11 の主証跡は `outputs/phase-11/manual-test-result.md`。grep / diff / build / lint / token gate の deterministic evidence で NON_VISUAL の代替証跡を構成する。

実行済みの確認対象:

- `grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css` は 2 件。
- `grep -n 'parallel-01 P1-1 page surface' apps/web/src/styles/globals.css` は 1 件。
- `mise exec -- pnpm --filter @ubm-hyogo/web build` は PASS。
- `mise exec -- pnpm --filter @ubm-hyogo/web lint` は PASS。
- `mise exec -- pnpm verify:tokens` は PASS。
- `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/__tests__/tokens.runtime.spec.ts` は 1 file / 9 tests PASS。

## Boundary

commit / push / PR 作成、staging screenshot、completed-tasks への physical move は user-gated。local implementation、Phase 11 NON_VISUAL evidence、Phase 12 strict 7 は本 wave で完了済み。
