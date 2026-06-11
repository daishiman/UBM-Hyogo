# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> SSOT: [`shared-context.md`](./shared-context.md)。Phase 4 へ進めるかを判定する。

## 1. 要件レビュー思考法（5 項目一次結論）

| 観点 | 結論 |
|------|------|
| 真の論点 | 「絞り込みが壊れている（機能バグ）」＋「画面の用途と見た目が分からない（情報設計・視覚整合）」の 2 系統が 1 画面に同居。主問題は **web 表現層 / adapter 層の drift と情報設計欠如**であり、API/D1 は無罪 |
| 依存・責務境界 | parse 境界は `api.ts` に閉じる。表示の状態所有は `SchemaDiffHistoryPanel` 単一。純データ（glossary）・純関数（error formatter）・純表示（explainer）を分離し、責務が混ざらない |
| 価値とコストの不均衡 | 最大価値は Lane A（壊れた絞り込みの根治・1 行追加で達成）。次点は Lane C（用途明確化）。Lane B/D は中コスト中価値。すべて 1 サイクルに収まり先送り不要 |
| 改善優先順位 | A（バグ根治）> C（用途明確化）> B（エラー堅牢化）> D（カード整合）> E（回帰）。ただし全 Lane を同一 wave で実装（CONST_007） |
| 4 条件評価 | 価値性◯（管理者の「壊れている・分からない」を解消）/ 実現性◯（既存 surface・apps/web のみ・新 primitive なし）/ 整合性◯（責務境界・状態所有が閉じる）/ 運用性◯（回帰 spec + verify-design-tokens + apps/api diff gate で再発防止） |

## 2. 因果ループ

- 強化ループ（悪循環・修正前）: API が新キー追加 → web zod が追従せず reject → ZodError raw 表示 → 「壊れている・用途不明」の不信感増大。
- バランスループ（修正後）: web zod が既知キーを明示許容 + error formatter が raw JSON を抑止 → 失敗時も読みやすい日本語 → 信頼回復。将来キー増加時も raw JSON は出ない（Lane B が緩衝材）。

## 3. 設計判定チェックリスト

| 項目 | 判定 | 備考 |
|------|------|------|
| 新 API endpoint なし | OK | `GET /admin/audit` 再利用のみ |
| D1 schema 不変 | OK | migration 追加なし |
| apps/api 非接触 | OK | 変更対象は apps/web のみ（AC-9 で gate） |
| OKLch token のみ | OK | 参照表（phase-2 §5）の実在 token のみ。HEX 0（AC-8） |
| 新 primitive を生やさない | OK | explainer は表現 component、カードは素 markup + class。共有 primitive は再利用 |
| `.strict()` 維持 | OK | batchId のみ明示許容。防御性を落とさない |
| test 命名 `*.spec.{ts,tsx}` | OK | 不変条件 #6 |
| 状態所有権の単一性 | OK | panel が唯一。新規 3 部品は無状態 |
| CONST_007（1 サイクル完了） | OK | 全 Lane を同一 wave。先送り 0 |

## 4. MINOR 指摘（未タスク化候補・本サイクル外）

| ID | 指摘 | 判断 |
|----|------|------|
| M-1 | `schemaHistoryGlossary`（history 専用）と先例 `schemaGlossary`（`/admin/schema` 専用・未マージ）が将来重複しうる | 本サイクルでは分離が正。両者マージ後に共通用語集へ統合する候補として Phase 12 unassigned に記録 |
| M-2 | API `appliedFilters` の strict 化は web/api 双方で重複定義（shared 型化していない） | 既存設計の踏襲。shared 化は別タスク（スコープ拡大かつ API 接触のため本サイクル外）。Phase 12 unassigned 候補 |

> M-1/M-2 はいずれも「今サイクルで対応すると技術的・整合性的に破綻する（API 接触 / 未マージ依存）」ため分離が妥当（CONST_007 例外条件 1 に該当）。実施場所は Phase 12 `unassigned-task-detection.md`。

## 5. 判定

**PASS — Phase 4 へ進む。** 設計は責務境界・状態所有・不変条件・4 条件のいずれも矛盾なく閉じており、全 Lane が 1 実装サイクルに収まる。MINOR 2 件は未タスク化候補として分離（本サイクルの完了を妨げない）。
