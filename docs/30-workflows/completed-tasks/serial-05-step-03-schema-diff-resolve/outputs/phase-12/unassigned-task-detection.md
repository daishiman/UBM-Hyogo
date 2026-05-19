**[実装区分: 実装仕様書]**

# Phase 12 — Unassigned Task Detection

## 1. 検出結果

| 件数 | 詳細 |
| --- | --- |
| 0 | 本 step のスコープ内で新規に検出された未割当タスクはない |

`unassigned-task/` 配下から consume するエントリも 0 件。

## 2. Coverage layer 表

本 step が触れる layer の網羅状況を明示し、未カバー領域がスコープ外であることを示す。

| Layer | ファイル / 領域 | 本 step の扱い |
| --- | --- | --- |
| UI primitive | `apps/web/src/components/ui/*`（FormField, Icon ほか） | 流用のみ・新規追加なし |
| Page (server component) | `apps/web/app/(admin)/admin/schema/page.tsx` | 既存 `fetchAdmin("/admin/schema/diff")` + `SchemaDiffPanel` を維持 |
| Existing component | `apps/web/src/components/admin/SchemaDiffPanel.tsx` | hardening 対象 |
| Server fetch util | `apps/web/src/lib/admin/server-fetch.ts` | existing route / fixture 確認 |
| Mutation helper | `apps/web/src/lib/admin/api.ts` | `postSchemaAlias()` を単一 helper として維持 |
| API route | `apps/api/src/routes/admin/schema.ts` | 不変（既存 endpoint のみ使用） |
| D1 schema / migration | `apps/api/migrations/*` | 不変 |
| Design token | `apps/web/src/styles/tokens.css` | 既存 token 流用のみ |
| e2e | `tests/e2e/*` | regression smoke 維持 |

## 3. 後続候補（スコープ外）

将来的に独立タスク化を検討する候補。本 step では着手しない。

- alias bulk resolve（複数 diff を一括処理）
- diff history view（resolve 履歴の閲覧 UI）
- alias rollback / undo（2026-05-19 に `docs/30-workflows/issue-778-schema-alias-rollback-undo/` で consumed）
- admin notification（diff 発生時の通知）

## 4. 判定

`unassigned-task-detection = 0 件 / coverage 整合 / 後続候補は別 task で個別判断`。CI gate 上の 0 件 verdict として記録。
