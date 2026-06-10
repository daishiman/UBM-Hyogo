# Phase 3: 設計レビュー — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書]`

## 1. 要件レビュー思考法（一次結論 = 4 条件 + 5 観点）

| 観点 | 評価 |
|------|------|
| 真の論点 | 「アカウントの操作意味が分からない」を表層問題とせず、**因果の不可視（クリック→離れた位置にフォーム）+ 用語無説明 + 達成価値の非提示**という表現層の情報設計欠如を主問題に固定済み（Phase 1）。 |
| 依存関係・責務境界 | フォームの**描画位置**のみ `active` 駆動でカード直下へ移し、state ownership・API contract・bulk/rollback/undo の責務は不変。新規 `schemaReviewTerms`（純データ）と `SchemaReviewGuide`（表示）は副作用なし。境界は閉じている。 |
| 価値とコストの不均衡 | 最大価値 = インライン展開による因果の可視化（管理者の操作理解）。最大コスト部品 = `SchemaDiffPanel.tsx` のフォーム移設（既存 1049 行の構造変更）。だが JSX 位置移動 + ハンドラ再利用で差分は限定的。将来拡張（用語集の全 31 設問展開等）は初回スコープに混ぜない。 |
| 改善優先順位 | (1) インライン展開（因果可視化・AC-1）> (2) 文脈ヘルプ + やさしい用語（AC-2/3）> (3) 目的説明（AC-4）> (4) ペイン平易化（AC-5）。すべて今回サイクル内（CONST_007）。 |

### 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | 管理者の「クリックの因果が分からない」コストを直下展開で下げる。誰の何のコストを下げるか定義済み。 |
| 実現性 | PASS | apps/web 表現層のみ・既存 primitive 再利用・新 API 0。初回スコープに収まる厚み。 |
| 整合性 | PASS | 責務境界（描画位置のみ移動）・state ownership 不変・機械可読 id 不変で矛盾なし。 |
| 運用性 | PASS | `verify-design-tokens` / typecheck / lint / targeted vitest / `apps/api` diff 空で回帰検知可能。spec sync は Phase 12。 |

## 2. 因果ループ（最低 1 本ずつ）

- **強化ループ（B→改善）**: 直下展開 → クリックの因果が見える → 管理者が「名前割当が何をするか」を理解 → 未割当設問の解消が進む → スキーマ差分が減る。
- **バランスループ（過剰防止）**: 文脈ヘルプ/用語併記を増やしすぎると画面が冗長 → 主要 4-6 語に限定・ヘルプは一文 → 情報過多を抑制。

## 3. リスクと回避（Phase 4 へ進める前の確認）

| リスク | 回避策 |
|--------|--------|
| 既存 `SchemaDiffPanel.component.spec.tsx` がフォームをパネル末尾基準で query → インライン化で破綻 | Phase 4 でテストを「クリックカード直下」基準へ更新。回帰ケースで bulk/rollback/undo の不変を担保。 |
| `data-testid` / `aria-label` rename による E2E/外部参照破壊 | 機械可読 id は**不変**。表示テキスト・配置・補助 `<p>` 追加のみ（AC-6）。 |
| 新規 CSS の HEX 混入 | `var(--ubm-color-*)` のみ。`verify-design-tokens` で gate（AC-7）。 |
| 別ブランチ `admin-schema-page-purpose-clarity-ux` との重複/衝突 | dev tip ベースライン・命名差別化（`SchemaReviewGuide` vs `SchemaPurposeExplainer`）・焦点を「差分レビュー操作の流れ」に限定。 |
| props vs internal state 混同（VSCPKR-03） | インラインフォームの表示は既存 internal state `active` 駆動。新 props/state なし。Phase 4 で「`active` 駆動の表示」をテスト前提に明記。 |

## 4. 判定

**Phase 4 へ進行可（PASS）**。設計は 4 条件を満たし、責務境界が閉じ、価値とコストが均衡。先送り・別 PR 切り出しなし（CONST_007 準拠）。

## 完了条件

- [x] 4 条件 + 5 観点の一次結論を提示した。
- [x] 強化/バランスループを各 1 本記述した。
- [x] リスクと回避策を列挙した。
- [x] Phase 4 進行可を判定した。
