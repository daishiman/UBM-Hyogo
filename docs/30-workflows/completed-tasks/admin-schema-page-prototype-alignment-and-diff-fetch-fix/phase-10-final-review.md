# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## チェックリスト

| ID | 項目 | 期待 |
|----|------|------|
| FR-1 | 不変条件 #1〜#4 遵守 | Phase 3 trace で確認済 |
| FR-2 | 既存 API surface 不変 | 新 endpoint 0 / D1 schema 変更 0 |
| FR-3 | HEX 直書き新規 0 | page.spec.tsx grep guard + verify-design-tokens |
| FR-4 | プロトタイプ整合 | `pages-admin.jsx` `SchemaDiffPage` (L508-656) と DOM 構造同型 |
| FR-5 | 後方互換 | SchemaDiffPanel の hideInlineStats default=false、既存 caller 無傷 |
| FR-6 | 関連 docs 同期 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` `/admin/schema` 節更新 |
| FR-7 | skill 同期 | aiworkflow 3 surface（task-workflow-active / artifact-inventory / changelog）|
| FR-8 | Lane A 切り分け evidence | `outputs/phase-11/lane-a-curl-investigation.md` |

## レビュー対象差分

- web (Lane B/C/D): page.tsx 全面リライト + SchemaDiffPanel.tsx prop 追加 + AdminSidebar 1 行 + spec 3
- api (Lane A): contract spec 新規 + (条件付き) index.ts mount 順整理
- docs: specs/09g 同期 + 本 workflow + aiworkflow skill 3 file

## 出口条件

- Phase 1-10 + Phase 12 strict 7 が生成済み
- Phase 11 (manual visual test) は authenticated runtime evidence のため user-gated
- Phase 13 (PR) は user 承認後
- ローカル品質ゲート（typecheck/lint/test/build/verify-design-tokens/verify:phase12-compliance/gate-metadata/indexes/verify-pr-ready）全 PASS
