# Phase 6: テスト拡充 (異常系) — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 6 / 13 |
| wave | 05a-bugfix |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`get-form-preview.ts` の fail path / 回帰 guard を強化する。`schema_questions` 空 / `choiceLabelsJson` 不正 JSON / route 層 503 mapping の e2e 観点を追加する。

## 実行タスク

1. fail path テストを追加する。完了条件: TC-FAIL-01〜03 が unit 層に green で揃う。
2. 回帰 guard を追加する。完了条件: TC-REG-01（route 層 503 mapping 維持）が green。
3. route 層 e2e 観点の追加可否を最終判定する。完了条件: 採否を outputs に記録する。

## 参照資料

- `apps/api/src/use-cases/public/get-form-preview.ts`
- `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts`
- `apps/api/src/routes/public/index.test.ts`
- `packages/shared/src/errors.ts`

## 実行手順

- 対象 directory: `docs/30-workflows/task-05a-form-preview-503-001/`
- 本仕様書作成では実装・deploy・commit・push・PR を実行しない。

## 統合テスト連携

- 上流: Phase 5（GREEN）
- 下流: Phase 7（カバレッジ）, Phase 9（staging smoke）

## 多角的チェック観点

- #1 schema 固定禁止（不正 JSON でも crash せず空配列で fallback）
- #5 public boundary
- #14 schema 集約（fieldCount 整合）
- 未実装/未実測を PASS と扱わない

## サブタスク管理

- [ ] TC-FAIL-01〜03 / TC-REG-01 の入出力・assert を確定する
- [ ] route 層 e2e 追加可否を判定する
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md

## 完了条件

- fail path 3 ケース + 回帰 guard 1 ケースの仕様が記録される
- route 層 e2e の採否が明記される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装・deploy・commit・push・PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ、追加テストケースを含む `get-form-preview.ts` 全関数の coverage 計測対象を渡す。
