# Implementation Guide

[実装区分: 実装仕様書]

## 概要

`/admin/schema` の 2 問題（API 404 + UI/UX プロトタイプ未整合）を 1 サイクルで解消する。

## 変更ファイル一覧（PR 本文用）

### apps/web

- `apps/web/app/(admin)/admin/schema/page.tsx` — 全面リライト。page-head / current revision / stats grid-4 / SchemaDiffPanel / revisions+alias grid-2
- `apps/web/src/components/admin/SchemaDiffPanel.tsx` — `hideInlineStats` prop 追加、diff カード markup を `schema-field-card diff-{type}` + `Chip` 化
- `apps/web/src/components/layout/AdminSidebar.tsx` — label `"schema"` → `"スキーマ"`
- `apps/web/src/lib/admin/server-fetch.ts` — `PLAYWRIGHT_TEST=1` の `/admin/schema/diff` fixture fallback を追加し、既存 Playwright smoke/visual が 404 で壊れないように保護

### apps/web spec

- `apps/web/app/(admin)/admin/schema/page.spec.tsx` — 新規（ok / error 分岐）
- `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` — card rendering + `hideInlineStats` 回帰を既存 spec に追記
- `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` — sidebar label 回帰を更新
- `apps/web/playwright/page-objects/AdminSchemaPage.ts` — stale `admin-schema-section` landmark を新 UI shell assertion へ更新
- `apps/web/playwright/tests/admin-pages.spec.ts`, `apps/web/playwright/tests/full-smoke.spec.ts`, `apps/web/playwright/tests/visual/admin-schema-diff.spec.ts`, `apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts`, `apps/web/playwright/tests/issue776-schema-bulk-resolve.spec.ts` — `/admin/schema` 既存 Playwright expectations を新 heading / landmark へ更新

### apps/api

- `apps/api/src/routes/admin/schema.contract.spec.ts` — 既存 contract spec が `GET /schema/diff` 401 / 200 + items 配列 / recommendedStableKeys を保持。新規 API ファイルは作成しない

### docs

- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` — `/admin/schema` 節を新 UI に同期

### skill (aiworkflow-requirements)

- `references/task-workflow-active.md` — 1 行追加
- `references/workflow-admin-schema-page-prototype-alignment-and-diff-fetch-fix-artifact-inventory.md` — 新規
- `changelog/20260527-admin-schema-page-prototype-alignment-and-diff-fetch-fix.md` — 新規
- `indexes/quick-reference.md` — 1 行追加
- `indexes/resource-map.md` — 1 行追加

## 検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run
mise exec -- pnpm --filter @ubm-hyogo/api test --run
ADMIN_SCHEMA_DIFF_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/outputs/phase-11/screenshots PLAYWRIGHT_BASE_URL=http://localhost:3107 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/admin-schema-diff.spec.ts --project=visual-chromium
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm verify:phase12-compliance
```

## スクリーンショット参照

- `outputs/phase-11/screenshots/admin-schema-diff-added-desktop.png`
- `outputs/phase-11/screenshots/admin-schema-diff-changed-desktop.png`
- `outputs/phase-11/screenshots/admin-schema-diff-removed-desktop.png`
- `outputs/phase-11/screenshots/admin-schema-diff-unresolved-desktop.png`
- `outputs/phase-11/screenshots/admin-schema-diff-resolve-success.png`
- `outputs/phase-11/screenshots/admin-schema-diff-resolve-409.png`
- `outputs/phase-11/screenshots/admin-schema-diff-resolve-422.png`

## 既知制約

- D1 contract spec は `vitest.d1.config.ts` 経由
- Playwright `-linux.png` は CI 生成が正本
- staging deploy は user-gated
