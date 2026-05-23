# Phase 11 — 手動テスト

## 証跡メタ情報（FB-4）

- **証跡の主ソース**: local screenshot / grep gate / component test / typecheck / verify-design-tokens
- **スクリーンショット方針**: 実 UI surface を変更しているため、reachable な `not-found` route を Phase 11 screenshot として保存する。`error.tsx` と `loading.tsx` は route trigger が不安定なため DOM render test と grep gate で補完する
- **タスク分類**: UI task / VISUAL

## 実施項目

| # | 検証 | 手段 | 期待 |
|---|------|------|------|
| MT-01 | error.tsx render の className が utility 化されている | `apps/web/app/__tests__/error.component.spec.tsx` | completed |
| MT-02 | theme switch（warm / cool）で色が正しく追従 | data-theme 切替 + 再 render | bridge 経由なので追従する |
| MT-03 | error message readability | a11y contrast (text on bg) | task-09 baseline と同等 |
| MT-04 | grep gate（手動） | `rg -n 'text-\[var\(|bg-\[var\(|border-\[var\(|fg-muted|ubm-color-(primary|on-primary|border|surface-2)' apps/web/app/error.tsx apps/web/app/not-found.tsx apps/web/app/loading.tsx` | 0 件 |
| MT-05 | typecheck / lint / verify-design-tokens | `pnpm --filter @ubm-hyogo/web typecheck && pnpm --filter @ubm-hyogo/web lint && pnpm --filter @ubm-hyogo/web verify-design-tokens` | completed |
| MT-06 | screenshot | `outputs/phase-11/screenshots/not-found-desktop.png` | completed after Playwright Chromium install |

## 実施記録

実施日: 2026-05-14  
実施者: Codex  
ブランチ: detached HEAD  
コミット: ef00df87

| # | 結果 | メモ |
|---|------|------|
| MT-01 | completed | `RouteError` render className assertion |
| MT-02 | completed | `@theme inline` bridge utility assertion |
| MT-03 | completed | text roles / alert structure preserved |
| MT-04 | completed | grep gate 0 件 |
| MT-05 | completed | typecheck / verify-design-tokens completed; web test script completed 82 files / 555 tests |
| MT-06 | completed | `not-found-desktop.png` captured |

## Screenshot Coverage

| Surface | Evidence | Boundary |
| --- | --- | --- |
| `not-found.tsx` | `outputs/phase-11/screenshots/not-found-desktop.png` | reachable route screenshot |
| `error.tsx` | `apps/web/app/__tests__/error.component.spec.tsx` | route error trigger is not stable in local screenshot flow |
| `loading.tsx` | `apps/web/app/__tests__/error.component.spec.tsx` | transient route state is covered by DOM render assertion |

## Visual Gate Boundary

task-18 `playwright-smoke / visual` は downstream broad regression gate として継続する。本 task の close-out では「task-18 diff 0 実測済み」とは扱わない。
