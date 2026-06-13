# Phase 2 成果物 — localization-map（旧→新対応表 + 入力/出力/副作用）

> 正本: [`../../_shared-context.md`](../../_shared-context.md) §1。本書は完全対応表と各変更の入力・出力・副作用を記述する。

## 1. 完全対応表（旧 → 新・ファイル:行）

### A. 統計ラベル + B. 同期バッジ（`apps/web/src/components/public/Stats.tsx`）

| ID | ファイル:行 | 旧 | 新 | 変更箇所 |
| --- | --- | --- | --- | --- |
| A-1 | Stats.tsx:44 | `Members` | `公開メンバー` | `[data-stat="members"] [data-role="label"]` |
| A-2 | Stats.tsx:49 | `Zones` | `事業フェーズ` | `[data-stat="zones"] [data-role="label"]` |
| A-3 | Stats.tsx:54 | `Meetings / yr` | `年間の支部会` | `[data-stat="meetings"] [data-role="label"]` |
| A-4 | Stats.tsx:59 | `Last sync` | `最終データ更新` | `[data-stat="sync"] [data-role="label"]` |
| B-1 | Stats.tsx:64 | `Forms 同期中` | `自動で最新化` | `[data-role="badge-sync"]` 内テキストノード |

### C. eyebrow 削除（旧 → 削除後に残る日本語見出し）

| ID | ファイル:行 | 旧 | 削除後に残る見出し | 方式 |
| --- | --- | --- | --- | --- |
| C-1 | page.tsx:75 | `eyebrow="UBM HYOGO · CHAPTER SITE"` | 兵庫で、事業を育てる人のつながりを可視化する。 | prop 非伝播 |
| C-2 | page.tsx:94 | `<p data-role="eyebrow">FEATURED MEMBERS</p>` | 参加している事業者たち | 要素削除 |
| C-3 | AboutUbm.tsx:50 | `<p data-role="eyebrow">ABOUT</p>` | 事業支援コミュニティ「UBM」 | 要素削除 |
| C-4 | AboutUbm.tsx:56 | `<p data-role="eyebrow">THREE ZONES</p>` | UBM区画 | 要素削除 |
| C-5 | Timeline.tsx:51 | `<p data-role="eyebrow">RECENT MEETINGS</p>` | 最近の支部会 | 要素削除 |
| C-6 | CallToActionCTA.tsx:24 | `<p data-role="eyebrow">FOR MEMBERS</p>` | メンバー情報の掲載をお願いします | 要素削除 |

### D. dead CSS（`apps/web/src/styles/legacy-public.css`・セレクタで特定）

| ID | セレクタ | 処理 |
| --- | --- | --- |
| D-1 | `[data-component="call-to-action-cta"] [data-role="eyebrow"]` | 削除 |
| D-2 | `[data-component="about-ubm"] [data-role="eyebrow"]` | 削除 |
| D-3 | `[data-component="featured-members"] [data-role="eyebrow"]` | 削除 |
| D-4 | `[data-component="timeline"] [data-role="header"] [data-role="eyebrow"]` | 削除 |
| D-5 | `[data-component="hero"][data-variant="card"] [data-role="eyebrow"]` | **保持** |
| D-6 | `[data-role="heading"]`（CTA・320–323） | `margin-top: var(--ubm-space-2)` → `0` |

## 2. 各変更の入力 / 出力 / 副作用

### A-1..A-4 / B-1（文字列置換）

- **入力**: `Stats` props（`stats: PublicStatsView`）は不変。テキストノードはハードコード文言。
- **出力**: ラベル/バッジの可視テキストが日本語へ。`value`（`stats.*` 由来）/ `sub` は不変。
- **副作用**: なし（DOM 構造・data 属性・型契約すべて不変）。`PublicStatsView` 型・`/public/stats` 取得経路に影響なし。

### C-1（Hero prop 非伝播）

- **入力**: `<Hero …>` から `eyebrow` を除く（title/subtitle/CTA は維持）。
- **出力**: ホームの Hero に overline `<p data-role="eyebrow">` が描画されない（Hero.tsx:48 が `null` を返す）。
- **副作用**: Hero 本体・`Hero.component.spec.tsx` は不変（eyebrow prop を渡すケースは依然描画される）。CSS D-5 は保持。

### C-2..C-6（要素削除）

- **入力**: 各セクションの `<p data-role="eyebrow">…</p>` を JSX から削除。
- **出力**: overline 非表示。直下の日本語見出し（`section-heading` / CTA `heading`）がブロック先頭になる。
- **副作用**:
  1. 対応 CSS（D-1..D-4）が dead rule 化 → 同サイクルで削除。
  2. 見出しが先頭要素になることで上端余白が変化。about-ubm / featured-members / timeline の `section-heading` は `margin-top:0` 相当でカード/ヘッダー上端に揃う（視覚問題なし）。CTA は D-6 で `heading` の `margin-top` を 0 にして上端余白の増分を打ち消す。
  3. 既存テスト（T2/T3/T4）の eyebrow assertion が破綻 → Phase 4 で eyebrow 不在 assertion へ更新。

### D-1..D-4（CSS 削除） / D-6（margin-top 調整）

- **入力**: セレクタ文字列で特定したルールブロック。
- **出力**: dead CSS 0、CTA 見出し上端余白の意図しない増加なし。
- **副作用**: 色追加 0（`verify-design-tokens` 緑維持）。行番号はトップから削除でズレるためセレクタ特定が必須。
