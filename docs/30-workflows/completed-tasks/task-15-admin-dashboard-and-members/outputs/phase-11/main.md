# Phase 11: 手動テスト / スクリーンショット

## 状況
- local Playwright fixture による screenshot capture を実施済み
- command: `pnpm -F @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/task15-admin-screenshots.spec.ts`
- result: PASS, 1 test

## Screenshot evidence
- `admin-dashboard-default.png`
- `admin-dashboard-schema-alert.png`
- `admin-dashboard-zone-placeholder.png`
- `admin-members-default.png`
- `admin-members-filter-published.png`
- `admin-members-bulk-selected.png`
- `admin-members-drawer-open.png`
- `admin-members-empty.png`
- `admin-layout-sidebar-active.png`
- `phase11-capture-metadata.json`
- `manual-test-result.md`
- `ui-sanity-visual-review.md`

## 補足
- `admin-dashboard-schema-alert.png` は local Playwright fixture で `unresolvedSchema = 5` を設定して capture。
- staging runtime evidence は Phase 13/user-gated release evidence として扱う。

## 判定
- 機能正当性: unit tests + Playwright fixture screenshot で担保
- 視覚 regression / browser smoke: local fixture PASS。staging runtime は Phase 13/user-gated release evidence として扱う
