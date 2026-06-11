# Phase 11: 手動テスト（3 層評価計画） — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書 / VISUAL_ON_EXECUTION / implemented_local_evidence_captured]`

本タスクは **VISUAL** であり、local component evidence は本 wave で取得済み。authenticated staging 実画面操作・screenshot 取得は user-gated のため、以下は staging runtime で実行する手動テスト計画である。

---

## 1. 3 層評価の計画

### 1-1. Semantic（意味・構造）層

| # | 評価項目 | 手順（本 wave） | 期待 | 判定 |
|---|---------|------------------|------|------|
| S1 | インライン展開の DOM 従属 | ラベルクリック後、`data-component="schema-assign-inline-form"` が当該 `schema-field-card`（クリックした diff）の子孫であること | カード直下に存在（最下部でない）（AC-1） | local PASS / staging_visual_pending |
| S2 | 文脈ヘルプの存在 | フォーム展開時に `[data-role="assign-help"]` が表示され「過去回答が新設問に対応づく」旨を含む | 表示あり（AC-2） | local PASS / staging_visual_pending |
| S3 | 機械可読 id 不変 | `data-testid` / `aria-label`（`select diff ${questionId}` 等）/ bulk・rollback・recompute の id・role が現行と一致 | rename 0（AC-6） | local PASS |
| S4 | 不変条件 #14 | `SchemaDiffPanel` / `SchemaReviewGuide` の runtime import 元が `page.tsx` のみ。`SchemaDiffPanel` exported type の既存 type-only import は例外 | runtime import 境界維持（AC-9） | local PASS |

### 1-2. Visual（視覚）層

| # | 評価項目 | 手順（本 wave） | 期待 | 判定 |
|---|---------|------------------|------|------|
| V1 | 目的説明セクション | `/admin/schema` 冒頭に `SchemaReviewGuide`（3 ステップ flow + 用語ミニ集）が表示 | 表示あり（AC-4） | local PASS / staging_visual_pending |
| V2 | インラインフォームの視覚従属 | カード直下フォームが左罫線・余白で親カードに従属して見える（`.schema-assign-inline-form`） | 親カードとの従属が視認可（AC-1） | local PASS / staging_visual_pending |
| V3 | やさしい用語表示 | label「新しい永続的な名前（技術名: stableKey）」/ ペイン平易文が表示 | 表示あり（AC-3 / AC-5） | local PASS / staging_visual_pending |
| V4 | デザイントークン整合 | 新規 CSS の色が既存トーンと整合し HEX 直書きなし | `verify-design-tokens` PASS（AC-7） | local PASS |

### 1-3. AI UX（体験）層

| # | 評価項目 | 観点 | 期待 | 判定 |
|---|---------|------|------|------|
| U1 | 因果の可視性 | 「クリック→直下に展開」で操作の因果が即座に理解できるか | 管理者が割当操作の意味を把握できる | local PASS / staging_visual_pending |
| U2 | 用語の平易性 | 専門用語が予備知識なしに理解できるか | やさしい日本語主・技術名併記で理解可 | local PASS / staging_visual_pending |
| U3 | 達成価値の伝達 | 「割り当てると過去回答が繋がる」価値が画面で伝わるか | 目的説明 + 文脈ヘルプで伝達 | local PASS / staging_visual_pending |

---

## 2. screenshot 計画（canonical 名）

Authenticated staging runtime で取得予定。命名は `<component>-<state>.png` 形式。

| # | canonical 名 | 内容 |
|---|-------------|------|
| 1 | `schema-review-guide-default.png` | ページ冒頭の目的説明（3 ステップ flow + 用語ミニ集）表示 |
| 2 | `schema-diff-card-collapsed.png` | 差分カードのフォーム未展開状態 |
| 3 | `schema-diff-card-inline-form-expanded.png` | ラベルクリックでカード直下にフォーム展開 |
| 4 | `schema-assign-help-visible.png` | 文脈ヘルプ + やさしい用語（技術名併記）表示 |

> **本 wave では未取得（staging_visual_pending_user_gate）**。local code は存在するが authenticated staging runtime は未実行のため、実画像は user-gated で取得する。

---

## 3. 完了条件

- [x] 3 層評価（Semantic / Visual / AI UX）の計画を記述した。
- [x] screenshot canonical 名 4 件を列挙した。
- [x] 本 wave では未取得（staging_visual_pending）である旨を明記した。
- [x] local PASS と staging_visual_pending の境界を判定行に明記した。
