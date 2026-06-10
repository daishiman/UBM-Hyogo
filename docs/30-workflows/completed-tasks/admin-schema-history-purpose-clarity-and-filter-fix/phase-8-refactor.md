# Phase 8: リファクタ

[実装区分: 実装仕様書]

> SSOT: [`shared-context.md`](./shared-context.md)。本タスクは最小実装（CONST_007 1 サイクル完了）であり、大規模リファクタは行わない。
> ただし「重複削減」「責務分離」「navigation / duplicate drift の解消」に資する小規模リファクタは実装と同一 wave で記録する。

## 1. 方針

**最小実装のため大規模リファクタは行わない。** 変更対象は apps/web 表現層 / adapter 層に限定し、API surface・D1・Form は非接触（不変条件 #5）。
一方で、本サイクルの設計（Phase 2）が既に「純データ・純関数・純表示の分離」を内包しているため、以下の集約リファクタを **実装と同時に**行う。これらは新規コード増を伴うが、既存の脆弱な重複・raw markup を解消する net 改善である。

## 2. リファクタ一覧 [Feedback RT-03]

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| エラー表示の catch ロジック | `SchemaDiffHistoryPanel.tsx` の 2 箇所（`load` 行 80-81 / `onNext` 行 119-120）で `setError(e instanceof Error ? e.message : ...)` を**重複**して保持。raw `e.message`（ZodError では JSON 文字列）をそのまま state へ | 2 箇所とも `setError(formatSchemaHistoryError(e))` に統一。例外→日本語変換ロジックを純関数 `formatSchemaHistoryError`（`schemaHistoryError.ts`）へ**集約** | 重複した catch 三項演算を 1 箇所に集約し、raw JSON 露出（RC-2）を構造的に根絶。純関数化でテスト容易性も向上（Lane B / COV-B1） |
| 用語・流れデータ | UI コンポーネント内に文言をベタ書きする設計だと、表示と知識データが混在し再利用・テストが困難 | `schemaHistoryGlossary` / `schemaHistoryPurposeSteps` を `schemaHistoryGlossary.ts` の**純データへ分離**。`SchemaHistoryPurposeExplainer` は import して描画するのみ | UI（表示）と knowledge（データ）の責務分離。先例 `schemaGlossary` と同じ設計思想。データ単体テストが可能になる（Lane C / COV-C2） |
| 履歴 markup | 素の `<table>`（行 187-224）。CSS クラス無しでプロトタイプ ALIAS HISTORY と不整合。inline 寄りの脆弱な構造 | `<ul className="schema-history-list">` + `<li className="schema-history-card">` の **class ベース markup** へ。スタイルは `globals.css` の OKLch token クラスへ外出し | 視覚整合（RC-4）と保守性。inline style / HEX 直書きを避け token クラスへ集約（不変条件 #2 / AC-8）。`data-audit-id` は保持し spec 互換を維持 |
| error 表示の inline / 無クラス | 行 185 `<p role="alert">{error}</p>` は CSS クラスが無く（globals.css にスタイル無し）レイアウト崩れの原因 | `<p role="alert" className="schema-history-error">{error}</p>` + `globals.css` に `.schema-history-error`（OKLch token のみ） | 表示崩れ（RC-2 の見た目）の解消。スタイルを CSS クラスへ集約し markup から分離 |

## 3. navigation drift / duplicate 削減観点

| 観点 | 評価 |
|------|------|
| navigation drift | `history/page.tsx` の `AdminPageHeader` breadcrumb を「管理 → Form schema → 紐付け履歴」に整え、旧「履歴」表記の曖昧さを解消（Lane C）。新規 route / nav エントリは追加しない（drift を生まない）。title/description の平易化のみで導線構造は不変 |
| duplicate 削減 | catch 三項演算の重複（2 箇所）を `formatSchemaHistoryError` へ 1 本化。これが本サイクル唯一の明確な duplicate 削減 |
| 残存する重複（本サイクル外） | `AppliedFiltersZ`（web）と API `audit.ts` の `appliedFilters` strict 定義は **web/api 双方で重複**するが、shared 型化は API 接触を伴うためスコープ外（Phase 3 MINOR M-2 / Phase 12 unassigned 候補）。`schemaHistoryGlossary` と先例 `schemaGlossary` の将来重複も同様（M-1） |

## 4. リファクタしないと明示するもの（過剰改変の回避）

- `normalizeAppliedFilters`（api.ts 行 635 付近）: spread で全キーを通すため batchId 追加で自動追従。改変不要。
- `fetchSchemaAliasHistory` の fetch / parse フロー: parse 境界は維持し schema 定義のみ修正（Phase 2 §1）。フロー自体はリファクタしない。
- `AdminPageHeader` / `EmptyState` / `Pagination` / `FormField`: 再利用のみ。primitive を生やさない / 改変しない（不変条件 #3）。
- `.strict()` の `.passthrough()` 化: 採らない。防御性を落とすため、batchId のみ明示許容する（Phase 2 §3 Lane A 設計判断）。

## 5. 判定

最小実装方針を維持しつつ、Phase 2 設計に内包された 4 件の集約リファクタ（catch 集約 / glossary 純データ分離 / card class 化 / error class 化）を実装と同一 wave で実施する。大規模な構造変更・API 接触を伴う shared 化は行わず、それらは Phase 12 unassigned へ送る。
