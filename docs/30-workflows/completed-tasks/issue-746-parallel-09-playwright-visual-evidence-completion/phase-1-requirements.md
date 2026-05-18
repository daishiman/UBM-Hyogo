# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 1. 目的

parallel-09 UX cross-cutting primitives の Playwright visual evidence (6 primitive × 2 scale = 12 PNG) を取得し、`completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md` の evidence claim を `runtime_pending → completed` に昇格する。

## 2. 受入条件 (AC)

- **AC-1**: `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/` 配下に 12 PNG（下記 list）が存在し、各 ≤ 500KB。
- **AC-2**: `pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts --reporter=line` がローカルで 0 fail / 0 flaky で完走。
- **AC-3**: spec の `evidenceDir` パスが新 evidence path (`completed-tasks/...`) を指すよう修正済み。
- **AC-4**: `completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md` の `runtime_pending` 記述が `completed` に更新済み。
- **AC-5**: `outputs/phase-12/unassigned-task-detection.md`（親 workflow）の Open Runtime Boundary 該当行が `consumed` に更新済み。
- **AC-6**: ENOSPC リカバリ runbook が `phase-10-operational-runbook.md` に保存済み。
- **AC-7**: typecheck / lint が green。
- **AC-8**: PNG 一覧が CLAUDE.md 不変条件3「プロトタイプ正本順位」と視覚的に整合（目視レビュー）。

## 3. 期待 PNG 一覧

`1x` は Playwright config の既定 viewport、`2x` は同 locator を 2560x1600 viewport で再取得した拡大確認用 PNG を指す。deviceScaleFactor=2 や mobile 375px capture ではない。

| ID | 1x | 2x | route | selector |
|----|----|----|-------|----------|
| 01 | 01-formfield-error.png | 01-formfield-error@2x.png | /visual-harness/formfield-error | `[data-component="form-field"]` |
| 02 | 02-icon-4sizes.png | 02-icon-4sizes@2x.png | /visual-harness/icon-4sizes | `[data-visual="icon-grid"]` |
| 03 | 03-breadcrumb.png | 03-breadcrumb@2x.png | /visual-harness/breadcrumb | `nav[aria-label="breadcrumb"]` |
| 04 | 04-focus-visible.png | 04-focus-visible@2x.png | /visual-harness/focus-visible | `[data-visual="focus-grid"]` |
| 05 | 05-pagination-disabled.png | 05-pagination-disabled@2x.png | /visual-harness/pagination-disabled | `[data-component="pagination"]` |
| 06 | 06-empty-state.png | 06-empty-state@2x.png | /visual-harness/empty-state | `.ui-empty-state` |

## 4. スコープ

### 含む
- `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` の `evidenceDir` 定数のみパッチ
- Next dev server (`pnpm --dir apps/web dev`) 起動 → Playwright 実行 → 12 PNG 生成
- evidence path への配置と state 文字列更新

### 含まない
- Playwright spec のロジック・selector 変更
- harness route (`apps/web/app/visual-harness/[name]/`) の変更
- 新規 primitive 追加（不変条件3 違反）
- CI workflow への visual job 追加（task-18 / task-22 で別途）

## 5. 前提

- ローカル disk 11Gi 空き済み（df -h `/System/Volumes/Data` で 11Gi available 確認済 2026-05-17）
- chromium binary は既存 `~/Library/Caches/ms-playwright/` (528MB) を流用
