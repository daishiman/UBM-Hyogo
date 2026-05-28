# System Spec Update Summary

[実装区分: 実装仕様書]

## 対象 system spec

`docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`

## 変更節

`/admin/schema`（Schema Diff レビュー画面）

## 更新内容（要約）

| Before | After |
|--------|-------|
| Breadcrumb 「Form schema」 + `セクション1..6` ベタ箇条書き + SchemaDiffPanel + error fallback | PageHead (eyebrow=ADMIN / SCHEMA, title=「スキーマ差分のレビュー」) + CurrentRevisionCard + Stats grid-4 + SchemaDiffPanel(hideInlineStats=true) + Revisions + AliasHistory grid-2 |
| Breadcrumb label "Form schema" | "スキーマ" |
| sidebar nav label "schema" | "スキーマ" |
| `/admin/schema/diff` 404 失敗時の挙動明示なし | `AdminSectionErrorClient` 1 つのみ描画（致命扱い）と明文化 |

## 追加表記事項

- 既存 API surface のみ使用（新規 endpoint なし）
- D1 schema 不変
- OKLch tokens 正本（HEX 直書き禁止）
- diff カード class 規約: `schema-field-card diff-{added|changed|removed}`
- 差分種別 Chip tone マッピング: added=ok / changed=warn / removed=danger / alias=info

## 関連 spec

- `09g-screen-blueprints-admin.md` `/admin/schema/history` 節は変更なし（diff page から link のみ）
- `08-free-database.md` は変更なし（D1 schema 不変）
