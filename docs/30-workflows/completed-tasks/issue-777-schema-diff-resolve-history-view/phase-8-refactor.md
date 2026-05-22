# Phase 8: リファクタ

## 結論

本タスクでは「既存 UI への構造的リファクタ」は実施せず、新規追加した `SchemaDiffHistoryPanel` 周辺の **重複除去・命名整合・import 整理・dead code 除去** のみを最終確認として行う。新規 primitive 抽出や `SchemaDiffPanel` との共通化は本スコープ外（CLAUDE.md UI prototype alignment 不変条件3「新規 primitive を生やさない」と整合）。

## 1. 重複検出スコープ

| 観点 | 比較対象 | 判定基準 | 対応 |
|---|---|---|---|
| panel container 構造 | `SchemaDiffPanel.tsx` vs `SchemaDiffHistoryPanel.tsx` | 同一 wrapper class が 3 回以上連続出現 | 同等 class 群はそのまま温存（共通化は merge 後の別 PR 検討） |
| filter form layout | `MembersPage` / `RequestsPage` の filter | shared `FormField` primitive を全件再利用しているか | 直 `<input>` 増加は禁止（CLAUDE.md 不変条件 #9） |
| pagination UI | parallel-09 提供 `Pagination` primitive | cursor 受け渡しが opaque string か | opaque 維持。internal 構造に依存する props を追加しない |
| empty 状態 | parallel-09 提供 `EmptyState` primitive | テキスト直書きしていないか | `EmptyState` のスロット props 経由のみ |
| breadcrumb | parallel-09 提供 `Breadcrumb` primitive | `admin > schema > history` 3 階層になっているか | 階層ラベル文字列のみ props で渡す |

## 2. 命名整合チェック

| 種別 | 命名規則 | 適合確認 |
|---|---|---|
| Component | `SchemaDiffHistoryPanel`（PascalCase + Panel suffix） | `SchemaDiffPanel` 兄弟と整合 |
| Page route | `apps/web/app/(admin)/admin/schema/history/page.tsx` | 案 α（独立 route）採用と整合 |
| API helper | `fetchSchemaAliasHistory()` | `postSchemaAlias()` 兄弟と整合（`fetch` / `post` 動詞対比） |
| Spec file | `SchemaDiffHistoryPanel.component.spec.tsx` | 不変条件 #8（`.spec.tsx` 固定） |
| data-page 属性 | `data-page="admin-schema-history"` | 既存 `admin-schema` 兄弟と prefix 整合 |

## 3. import 整理

- `import` 順序: react → next → 外部 lib → `@/components/...` → `@/features/...` → `@/lib/...` → 相対 path
- 未使用 import を `pnpm lint` で機械的に検出（Phase 9 で確認）
- type-only import は `import type { ... }` に分離
- `@/features/admin/hooks/useAdminMutation` は本タスクでは未使用（read-only）なので import しない

## 4. dead code 除去確認

| 項目 | チェック |
|---|---|
| 未使用 helper | `fetchSchemaAliasHistory()` が history page と spec の双方から参照されている |
| TODO コメント | 残存しない（残す場合は issue 番号 + 担当範囲を明示） |
| `console.log` | 残存しない（`pnpm lint` no-console で機械検出） |
| 仮実装 fallback | mock データ・hardcoded サンプル行を含まない |

## 5. 既存 `SchemaDiffPanel` との共通化候補（本スコープ外メモ）

merge 後の別 PR で検討する余地があるが、本 PR では実施しない（CONST_007「今サイクル完了スコープを膨張させない」）:

- `SchemaAliasRow` のような共通行 component の抽出（before/after stableKey + question text 描画）
- `useSchemaAuditFilter` のような filter state hook の共通化（diff 一覧と history 一覧で filter 入力 UI を共通化する場合）
- `formatStableKey()` の utility 抽出（diff / history どちらも同じ表記揺れ正規化を行う場合）

抽出基準: **同等構造の重複が 3 箇所以上発生したら次サイクルで primitive 化を検討**。本タスクでは 2 箇所（diff / history）に留まるため未抽出。

## 6. 後続タスクへの申し送り

- followup-004（rollback / undo）が本 UI を起点に「行 → rollback action」導線を貼る前提のため、行 component の DOM 構造に `data-audit-id` を残す（rollback 起動の anchor として利用予定）
- bulk resolve（followup-002）と組み合わさったあと、bulk 識別 flag を payload に持たせる場合は本 panel 側で `<Badge variant="info">bulk</Badge>` 追加が候補。本 PR では未対応
