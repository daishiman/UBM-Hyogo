# Phase 8: リファクタ

[実装区分: 実装仕様書]

## リファクタ項目

| ID | 対象 | 内容 |
|----|------|------|
| RF-1 | `page.tsx` page-local helper | `PageHead` / `SchemaCurrentRevisionCard` / `SchemaDiffStatsGrid` / `SchemaRevisionsList` を page.tsx 内 file-local に閉じる（export しない） |
| RF-2 | tokens 統一 | inline color / HEX を `var(--admin-...)` token に置換 |
| RF-3 | SchemaDiffPanel stats 行分離 | `<StatsRow />` を独立コンポーネント化（同ファイル内）し `hideInlineStats` でレンダ抑止 |
| RF-4 | 不要な fallback 削除 | 旧 page.tsx の「`Array.from({ length: 6 }, ...)` の `セクション1..6` ベタ箇条書き」fallback を削除（diff 取得失敗時は `AdminSectionErrorClient` のみ表示） |
| RF-5 | breadcrumb label 統一 | `<Breadcrumb items={[{ label: "Form schema" }]} />` → `{ label: "スキーマ" }` |

## 守るべき原則

- 単一責務原則: page.tsx は「server fetch + 配置」、各 helper は「描画のみ」
- 既存 SchemaDiffPanel の caller（`apps/web/app/(admin)/admin/schema/history/page.tsx` 等）の挙動を破壊しない（hideInlineStats default false）
- 新 token / 新 primitive を追加しない（不変条件 #3）

## アンチパターン回避

- ❌ `page.tsx` から `_shared/AdminPageHead` を新規 export して他 admin page と統一しようとする → 本タスクのスコープ外。新 primitive 抑止
- ❌ SchemaDiffPanel から stats を完全削除する → 既存 caller の挙動破壊
- ❌ 旧「セクション1..6」UI を残す → プロトタイプと未整合のまま放置

## 検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run
```
