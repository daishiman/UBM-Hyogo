# Phase 7: カバレッジ確認 — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 7 / 13 |
| wave | 05a-bugfix |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

変更ファイル限定（Feedback BEFORE-QUIT-002 適用）で `apps/api/src/use-cases/public/get-form-preview.ts` の line / branch / function カバレッジが 100% であることを確認する。

## 実行タスク

1. coverage 計測を実行する。完了条件: 対象ファイルの line/branch/function/statement 4 指標が取得される。
2. 100% に満たない箇所を洗い出す。完了条件: 未カバー行・分岐の行番号が記録される。
3. 必要なら追加テストケースを起票する（Phase 6 への巻き戻しではなく phase-07 outputs に backfill 要件として記録）。

## 参照資料

- `apps/api/src/use-cases/public/get-form-preview.ts`
- `apps/api/vitest.config.ts`（coverage 設定）
- `docs/30-workflows/02-application-implementation/08a-A-public-use-case-coverage-hardening/outputs/phase-07/main.md`（参考）

## 実行手順

- 対象 directory: `docs/30-workflows/task-05a-form-preview-503-001/`
- 計測範囲は **変更ファイル限定**（`get-form-preview.ts`）。リポジトリ全体閾値は適用しない。
- 本仕様書作成では実行しない。

## 統合テスト連携

- 上流: Phase 6（fail path 完了）
- 下流: Phase 8（多角的レビュー）, Phase 9（staging smoke）

## 多角的チェック観点

- 未実測を PASS と扱わない
- 100% 未達の場合、追加テストか「合理的な未到達理由」のいずれかを明記
- 不変条件 #1 / #14 が coverage 検証で守られていること

## サブタスク管理

- [ ] coverage コマンドを実行する手順を確定する
- [ ] 100% 未達ライン特定の手順を記録する
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

## 完了条件

- `get-form-preview.ts` の line / branch / function / statement が **100%** であることが evidence と共に記録される
- 未達がある場合は backfill 要件（テストケース ID + 期待 assert）が記録される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 計測範囲が変更ファイル限定であることが明記されている
- [ ] 実装・deploy・commit・push・PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、coverage report path・100% 未達箇所・backfill 要件を渡す。
