# admin-schema-page-prototype-alignment-and-diff-fetch-fix

[実装区分: 実装仕様書]

## 概要

staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/schema` で観測された 2 問題を 1 サイクルで解消する実装仕様。

- Lane A: `GET /admin/schema/diff` が 404 を返す問題の原因切り分け + 既存 endpoint 健全化 + regression contract spec 追加
- Lane B: `/admin/schema` page を `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` `SchemaDiffPage` (L508-656) に整合（page-head / CURRENT REVISION / stats grid-4 / SchemaDiffPanel / REVISIONS + ALIAS HISTORY grid-2）
- Lane C: 既存 `SchemaDiffPanel` の prototype primitive 整合（`schema-field-card diff-{type}` + `Chip` tone）
- Lane D: 左サイドバー nav 表記 `"schema"` → `"スキーマ"` 統一（他項目と日本語整合）
- Lane E: 回帰テスト追加（vitest page spec + Playwright visual baseline + contract spec）

| 項目 | 値 |
|------|---|
| workflow_state | `implemented_local_evidence_captured` |
| branch | `feat/admin-schema-page-prototype-alignment-and-diff-fetch-fix` |
| base | `origin/dev` |
| 親 workflow | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment/`（Lane A 由来は独立。Lane B-D は admin-ui-prototype-alignment の follow-up 性格） |
| 不変条件 | 既存 API surface のみ / D1 schema 不変 / OKLch tokens のみ / プロトタイプ primitives 正本 |
| スコープ | `/admin/schema`（page + diff panel + sidebar label）+ `apps/api/src/routes/admin/schema.ts` の regression contract |

## Phase 一覧

| Phase | 内容 | output |
|-------|------|--------|
| 1 | 要件定義 | `phase-1-requirements.md` |
| 2 | 設計 | `phase-2-design.md` |
| 3 | 設計レビュー | `phase-3-design-review.md` |
| 4 | テスト計画 | `phase-4-test-plan.md` |
| 5 | 実装手順 | `phase-5-implementation.md` |
| 6 | テスト追加 | `phase-6-test-additions.md` |
| 7 | カバレッジ | `phase-7-coverage.md` |
| 8 | リファクタ | `phase-8-refactor.md` |
| 9 | QA | `phase-9-qa.md` |
| 10 | 最終レビュー | `phase-10-final-review.md` |
| 11 | 手動テスト | `phase-11-manual-test.md` |
| 12 | ドキュメント同期 | `phase-12-documentation.md` + `outputs/phase-12/*` |
| 13 | PR | `phase-13-pr.md` |

## 正本順位

1. CLAUDE.md「UI prototype alignment / MVP recovery」不変条件 1〜4
2. `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` `SchemaDiffPage` (L508-656) + `styles.css` + `primitives.jsx` + `data.jsx`
3. `apps/api/src/routes/admin/schema.ts` の現行 endpoint surface（`GET /admin/schema/diff` / `POST /admin/schema/aliases` / `GET /admin/schema/history`）
4. `apps/web/src/components/admin/SchemaDiffPanel.tsx`（既存 1037 行・再利用前提）
5. `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`

## DoD（1 サイクル完了基準）

- Lane A: `curl` ベース切り分け表が phase-5 に含まれ、既存 `schema.contract.spec.ts` が `GET /schema/diff` 200 期待を保持する
- Lane B: page-head / CURRENT REVISION / stats grid-4 / REVISIONS / ALIAS HISTORY が `apps/web/app/(admin)/admin/schema/page.tsx` 1 ファイルに集約され、SchemaDiffPanel は子として props で stats 表示を制御
- Lane C: `SchemaDiffPanel` の diff カード markup が `schema-field-card diff-{type}` + `<Chip tone={...}>` を採用し、HEX 直書きを残さない
- Lane D: `apps/web/src/components/layout/AdminSidebar.tsx:10` の label が `"スキーマ"` に統一
- Lane E: web Vitest page/panel/sidebar specs + primitive adoption gate が PASS。既存 API contract spec が `GET /admin/schema/diff` 200 を保持
- `outputs/phase-12/*` strict 7 + `outputs/artifacts.json` が canonical 9 headings に準拠

## 実装済み差分（2026-05-27）

- `apps/web/app/(admin)/admin/schema/page.tsx`: 旧 `Form schema 概要` + `セクション1..6` fallback を撤去し、Breadcrumb「スキーマ」、page-head、CURRENT REVISION、stats grid-4、`SchemaDiffPanel hideInlineStats`、REVISIONS / ALIAS HISTORY grid-2 へ再構成。
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`: 後方互換 default の `hideInlineStats` prop を追加し、diff item を `schema-field-card diff-{type}` + `Chip` tone で描画。
- `apps/web/src/components/layout/AdminSidebar.tsx`: `/admin/schema` label を「スキーマ」に統一。
- `apps/web/app/(admin)/admin/schema/page.spec.tsx` と既存 component specs を更新し、web Vitest 1147 PASS を確認。
