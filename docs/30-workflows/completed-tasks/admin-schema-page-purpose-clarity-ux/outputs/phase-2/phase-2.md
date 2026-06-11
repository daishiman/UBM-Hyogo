# Phase 2 — 設計

> SSOT: [`../../_shared-context.md`](../../_shared-context.md) §5/§6 を実装トポロジの正本とする。

## 2.1 既存コンポーネント再利用可否（FB-SDK-07-1）

| 用途 | 再利用 | 判断 |
| --- | --- | --- |
| 目的説明カード外枠 | 既存 `.ui-card` / `card-pad-lg` クラス・`Banner`/`Card` プリミティブ | 再利用。新規プリミティブを生やさない（プロトタイプ正本順位 §3） |
| ステータス/種別バッジ | 既存 `Chip` / `Badge` | 再利用 |
| 0件表示 | 既存 `EmptyState` | 再利用 |
| 統計 | 既存 `AdminStat`（label/value/hint/tone） | props そのまま、値だけ平易化 |

新規は **構成コンポーネント** `SchemaPurposeExplainer`（プリミティブの組み合わせ）と **純データ** `schemaGlossary.ts` のみ。新規プリミティブ・新規 design token は追加しない。

## 2.2 トポロジ（3レーン）

```
page.tsx (server component)
 ├─ AdminPageHeader（description 更新: Lane A）
 ├─ <SchemaPurposeExplainer/>   ← 新規・常時表示（Lane A）
 │    └─ schemaGlossary（用語・流れ・結果）を参照
 ├─ <SchemaDiffStatsGrid/>      ← label/hint 平易化（Lane C, schemaGlossary.describeStat）
 ├─ <SchemaDiffPanel/>          ← カテゴリ説明・割り当てアウトカム・empty コピー（Lane B, schemaGlossary.describeDiffType）
 └─ <RevisionAndAliasHistory/>  ← 見出し平易化（Lane C）

globals.css: .schema-purpose-card / .schema-flow-steps / .schema-flow-step / .schema-flow-arrow / .schema-glossary（Lane C, OKLch）
```

## 2.3 `schemaGlossary.ts` 公開 API（純モジュール・テスト容易）

```ts
export interface GlossaryTerm {
  /** やさしい日本語の主表記 */
  plainLabel: string;
  /** 併記する技術名（mono 表記想定。なければ undefined） */
  technicalName?: string;
  /** 1〜2文の説明 */
  description: string;
}

/** ページ用語集（項目キー / 対応づけ / フォーム版数 / 差分 など） */
export const SCHEMA_GLOSSARY: Record<
  "stableKey" | "resolve" | "revision" | "diff" | "backfill",
  GlossaryTerm
>;

/** 3ステップの流れ（検知 → 対応づけ → 反映） */
export interface FlowStep { readonly index: number; readonly title: string; readonly detail: string; }
export const SCHEMA_FLOW_STEPS: readonly FlowStep[]; // length === 3

/** 結果プレビュー文（会員の回答が一覧/詳細/マイページに正しく表示される） */
export const SCHEMA_OUTCOME_SUMMARY: string;

/** diff type → 平易説明 + 推奨アクション */
export type DiffTypeKey = "added" | "changed" | "removed" | "unresolved";
export function describeDiffType(type: DiffTypeKey): { label: string; meaning: string; action: string };

/** 統計キー → 平易 label / hint（次アクション示唆） */
export type StatKey = "unresolved" | "added" | "changed" | "removed";
export function describeStat(key: StatKey): { label: string; hint: string };

/** 割り当て実行時のアウトカム説明（箇条書き行） */
export const ASSIGN_OUTCOME_POINTS: readonly string[];
```

- **入力/出力/副作用**: すべて純関数・純定数。副作用なし・例外なし（WEEKGRD-02: 未知キーは防御的に既定値を返す。`describeDiffType`/`describeStat` は未知キーで空ラベルではなく型で網羅、`satisfies Record<...>` でコンパイル時網羅を担保）。

## 2.4 `SchemaPurposeExplainer` props / 構造

```tsx
// 状態なし・API なし → server component で可
export function SchemaPurposeExplainer(): JSX.Element;
```

- 内部で `SCHEMA_FLOW_STEPS` / `SCHEMA_OUTCOME_SUMMARY` / `SCHEMA_GLOSSARY` を描画。
- `data-region="schema-purpose-explainer"` を付与（テスト/視覚特定用）。
- a11y: `<section aria-labelledby>` + 見出し id。流れ図は `<ol>`、各ステップ `<li>`。

## 2.5 ステップ間 state 引き渡し（該当なし）

- マルチステップ wizard ではない（常時表示の静的説明）。state ownership 表は N/A。
- SchemaDiffPanel の既存 state（grouped / active / bulkSelection 等）は **触らない**。表示文言の追加のみ。

## 2.6 CSS 設計（OKLch のみ）

| クラス | 役割 | 主トークン |
| --- | --- | --- |
| `.schema-purpose-card` | 説明カード外枠（`.ui-card` 併用） | `--ubm-color-surface-panel`, `--ubm-space-4`, `--ubm-radius-*` |
| `.schema-flow-steps` | 3ステップ横並び（flex-wrap） | `--ubm-space-3` |
| `.schema-flow-step` | 各ステップ枠 | `--ubm-color-border-default`, `--ubm-color-accent-soft` |
| `.schema-flow-arrow` | ステップ間の矢印（→） | `--ubm-color-text-secondary` |
| `.schema-glossary` | 用語集レイアウト | `--ubm-space-2` |

- HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止。`verify-design-tokens` で検査。

## 2.7 リスクと回避

- `page.tsx` を Lane A/C が触る → セクション単位で非競合、同一 wave 統合。
- `schemaGlossary.ts` の重複定義禁止（Lane A が SSOT 作成、B/C は import）。
- 既存 `SchemaDiffPanel` のロジック誤改変リスク → **表示文言の追加のみ**（handler/fetch/state 不変）を Phase 5 で逐語固定。

## 完了条件

- [x] 再利用判断（新規プリミティブ0）
- [x] トポロジ・3レーン境界確定
- [x] `schemaGlossary` API 署名確定
- [x] CSS トークン設計（OKLch）
- [x] state ownership = N/A 明記
