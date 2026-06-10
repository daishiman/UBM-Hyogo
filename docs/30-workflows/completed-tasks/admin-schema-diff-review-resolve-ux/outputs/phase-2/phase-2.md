# Phase 2: 設計 — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書]`

## 1. トポロジ（3 Lane / 関心ごとの分離）

```
page.tsx ──(import)── SchemaReviewGuide.tsx ──(import)── schemaReviewTerms.ts
   │                                                          ▲
   └──(import)── SchemaDiffPanel.tsx ──(import)───────────────┘
                       │
                 globals.css（.schema-assign-inline-form / .schema-review-guide-flow / .schema-review-glossary）
```

| Lane | 関心 | ファイル | SubAgent 配分（spec 執筆） |
|------|------|---------|---------------------------|
| Lane A | 差分レビュー操作の再構成 + 文脈ヘルプ + やさしい用語 | `SchemaDiffPanel.tsx` / `schemaReviewTerms.ts` | Phase 5 主記述 |
| Lane B | 目的説明 | `SchemaReviewGuide.tsx` / `page.tsx` | Phase 5 主記述 |
| Lane C | スタイル + テスト + Phase 11 | `globals.css` / 3 spec / screenshot 計画 | Phase 4/6/7/9/11 主記述 |

> local evidence captured のため Lane は「並列で**仕様を書く**」単位。コードの並列実装は本 wave 対象外。

## 2. 既存コンポーネント再利用可否（FB-SDK-07-1）

| 必要素 | 再利用 | 出典 |
|--------|--------|------|
| カード枠 | `ui-card` / `card-pad-lg` / `schema-field-card` | 既存 primitive / globals.css |
| 見出し | `eyebrow` / `h-section` | 既存 primitive |
| Chip | `Chip`（tone green/amber/red/cool）| `components/ui` |
| 入力 | `FormField` / `Input` | `components/ui`（不変条件 #9 準拠） |
| 空状態 | `EmptyState` | `components/ui` |
| mutation | `useAdminMutation`（`features/admin/hooks`）| 既存（不変条件 #10 準拠） |

> 新規 primitive は作らない。新規は `SchemaReviewGuide`（既存 primitive の組み合わせ）と `schemaReviewTerms`（純データ）のみ。

## 3. 割当フォームのインライン化設計（Lane A の核）

### Before（現状）

```
.schema-grid
  └ pane(unresolved) … card(737NEW4)  ← クリック
  …
（grid の後）<form aria-label="stableKey alias 割当"> … </form>   ← ここに出る（離れている）
```

### After（確定）

```
.schema-grid
  └ pane(unresolved)
      └ card(737NEW4)  ← クリック（active.diffId === it.diffId）
          └ {active?.diffId === it.diffId && active.questionId &&
               <div data-component="schema-assign-inline-form" className="schema-assign-inline-form"> … </div>}
```

- `grouped[t].map((it) => ...)` の各カード `<div className="schema-field-card ...">` の**末尾子要素**としてインラインフォームを条件描画。
- `.schema-grid` 後ろの旧 `<form>` ブロックと `active && !active.questionId` の `<p role="alert">` は削除し、後者は当該カード直下へ移設。
- フォーム内 JSX とハンドラ（`onSubmit` / `stableKey` state / `busy` / `feedback` / `stableKeyInputRef` / validation / `isValidStableKey` / `describedBy`）は**現行を完全再利用**。配置のみ移動。
- `useEffect([active])` の focus は維持（インライン化後も `active.questionId` あれば input focus）。

### state ownership（変更なし・確認）

| state | 所有 | 役割 |
|-------|------|------|
| `active` | SchemaDiffPanel | 選択中 diff（インラインフォームの表示分岐に流用） |
| `stableKey` / `busy` / `feedback` | SchemaDiffPanel | フォーム入力・送信状態 |
| bulk / rollback / undo / recompute | 各 hook / SchemaDiffPanel | **不変** |

> インライン化は「フォームの**描画位置**を `active` 駆動でカード直下へ移す」だけで、state ownership は現状維持。新たな state は追加しない。

## 4. 用語の対応づけ設計（Lane A）

`schemaReviewTerms.ts` の `SCHEMA_REVIEW_TERMS`（12 語）を SSOT とし、`plainLabel(technical)` / `termDescription(technical)` で参照。

- 主ラベル形式: `${plain}（技術名: ${technical}）`（例: `永続的な名前（技術名: stableKey）`）。
- 未登録キーは `plainLabel` で原文保持・`termDescription` で空文字（防御的・例外なし）。
- 適用箇所: フォーム label / 文脈ヘルプ / ペイン平易説明 / `SchemaReviewGuide` 用語ミニ集。

## 5. 目的説明設計（Lane B）

`SchemaReviewGuide.tsx`:
- `<section className="ui-card card-pad-lg" aria-labelledby="schema-guide-h">`。
- eyebrow「このページでできること」+ `<h2 id="schema-guide-h" className="h-section">`。
- 3 ステップ（`data-component="schema-review-guide-flow"`・番号付き）: 検出 → 名前割当 → 過去回答が対応づく。
- 用語ミニ集（`data-component="schema-review-glossary"`・主要 4-6 語）。
- `page.tsx` は `result.ok` ブロック先頭に `<SchemaReviewGuide />` を挿入、`description` 平易化。

## 6. スタイル設計（Lane C・OKLch token のみ）

| セレクタ | 役割 | token |
|---------|------|-------|
| `.schema-assign-inline-form` | カード直下の従属フォーム枠（左罫線 + 余白 + 背景 panel-2）| `var(--ubm-color-surface-panel-2)`, `var(--ubm-color-border-*)` |
| `.schema-review-guide-flow` | 番号付きステップの縦並び | `var(--ubm-color-text-secondary)` 等 |
| `.schema-review-glossary` | 用語ミニ集 `dl` / chip | 既存 chip token |
| `[data-role="assign-help"]` | ヘルプ文 muted | `var(--ubm-color-text-secondary)` |

> raw HEX / `bg-[#...]` 禁止。既存 `.schema-grid` / `.schema-field-card` は追記のみで非破壊。

## 7. テスト設計概要（Lane C・詳細は Phase 4）

- `schemaReviewTerms.spec.ts`: ヘルパの登録/未登録/全語整合。
- `SchemaReviewGuide.spec.tsx`: 3 ステップ・用語ミニ集・`data-component`。
- `SchemaDiffPanel.component.spec.tsx`: インライン展開（カード直下）・文脈ヘルプ・ボタン文言・回帰（bulk/rollback/undo 不変）。

## 8. システム境界の明記

| 境界 | 扱い |
|------|------|
| apps/web ↔ apps/api | 既存 `/api/admin/schema/aliases` proxy のみ。新規なし |
| D1 | 直接アクセスなし（継続） |
| Google Form schema | 不変 |
| 認証 | 既存 admin gate のまま |

## 完了条件

- [x] 3 Lane トポロジと SubAgent 配分を確定した。
- [x] 既存 primitive 再利用方針を確定し新規 primitive 0 を確認した。
- [x] インライン化の Before/After と state ownership 不変を設計した。
- [x] 用語/目的説明/スタイル/テストの設計を確定した。
- [x] システム境界（API/D1/Form/auth 不変）を明記した。
