# Phase 2: 既存実装調査

## 目的

親 #515 で導入された classifier interface / offline-replay harness / features schema / secret-leakage-grep の再利用ポイントを確定し、本タスクで新規追加すべき差分を最小化する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 調査対象

| ファイル | 確認事項 |
| --- | --- |
| `scripts/cf-audit-log/classifier/types.ts` | `Classifier` interface 署名 / `ClassifierInput` / `SeverityResult` 型 |
| `scripts/cf-audit-log/classifier/threshold.ts` | baseline 比較対象 / fallback 先のシグネチャ |
| `scripts/cf-audit-log/classifier/ml.ts` | skeleton fallback パターン（model artifact 未ロード時の挙動）の踏襲元 |
| `scripts/cf-audit-log/classifier/index.ts` | `getClassifier(env)` factory 実装。新候補追加箇所 |
| `scripts/cf-audit-log/features/extract.ts` | redacted feature の構造（IP /24 / hour / action category / status_class / actor_role hash） |
| `scripts/cf-audit-log/features/schema.ts` | feature TS 型 + JSON schema |
| `scripts/cf-audit-log/evaluation/offline-replay.ts` | replay loop / metrics 集計の拡張ポイント |
| `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | grep ルール / exit code |
| `scripts/cf-audit-log/cli-args.ts` | flag 追加箇所 |
| `tests/fixtures/cf-audit/synthetic-anomaly.jsonl` | 既存 fixture のフォーマット（dataset schema 同一性確認） |

## 再利用ポイント

| 親 #515 資産 | 本タスクでの利用 |
| --- | --- |
| `Classifier` interface | 3 ML classifier がそのまま implements |
| `ThresholdClassifier` | comparison harness の baseline / fallback 先 |
| `extractFeatures(event)` | 各 ML classifier の入力前処理に流用 |
| `offline-replay.ts` の metrics 集計 | `model-comparison.ts` で classifier list を取って同一 dataset に流す形に拡張 |
| `secret-leakage-grep.ts` | training output / comparison report 双方の検証に再利用 |
| `cli-args.ts` の既存 flag parser | `--compare-models` / `--training-output` を追加 |

## 新規実装が必要な差分

- 3 ML classifier 実装本体（`isolation-forest.ts` / `xgboost.ts` / `workers-ai.ts`）
- 学習スクリプト 2 本（IF / XGBoost）
- model-comparison harness（4 classifier × 1 dataset）
- selection-criteria（自動 winner 判定）
- synthetic 90 日 fixture と model artifact 例

## 完了条件

- [ ] 親 #515 ファイル一覧の現状仕様（interface / 型 / fixture schema）を `phase-02.md` に転記
- [ ] 再利用 / 新規の境界を明示
- [ ] 親 PR が未 merge の場合のスタブ作業手順（branch から cherry-pick 前提）を記述

## 出力

- `phase-02.md`

## 参照資料

- `index.md`
- `phase-01.md`
- 親 #515 全 phase ファイル

## 統合テスト連携

- 本 Phase は調査のみ。test は Phase 9 で計画する

## 依存Phase参照

Phase 1 の確定要件を上流契約として参照する。
