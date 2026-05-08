# Implementation Guide

## Part 1: 中学生レベル

このタスクは、Cloudflare の監査ログで「いつもと違う操作」を見つける方法を比べるためのしくみを作りました。

学校のテストで例えると、`precision` は「間違って怪しいと言った数の少なさ」、`recall` は「本当に怪しいものを見逃さなかった割合」です。`fallback rate` は AI が判断できずに古いルールへ戻った割合、`latency p95` はほとんどの判断がどのくらい速く終わるかを表します。

今回 Isolation Forest、XGBoost、Workers AI の3候補を比較対象にしました。練習用の偽物データで出た結果を本番の勝者とは呼びません。本番の90日データで同じ比較をもう一度実行してから切り替えます。

## Part 2: 技術者レベル

Issue #548 は親 #515 の `Classifier` abstraction、redacted feature extraction、offline replay、secret leakage grep を継承する。本サイクルで以下を実装した。

### 実装した変更

- `scripts/cf-audit-log/classifier/types.ts` — `ClassifierName` を `threshold | ml | isolation-forest | xgboost | workers-ai` に拡張し、comparison 用の `fallbackActive` signal を追加
- `scripts/cf-audit-log/classifier/isolation-forest.ts` 新規 — pure-TS Isolation Forest 推論。model artifact `isolation-forest-v1` を読み込み anomaly score を `[0,1]` に正規化。artifact 欠如時 `ThresholdClassifier` へ fallback
- `scripts/cf-audit-log/classifier/xgboost.ts` 新規 — pure-TS XGBoost decision-tree ensemble 推論（sigmoid output）。同じく fallback 機構付き
- `scripts/cf-audit-log/classifier/workers-ai.ts` 新規 — Cloudflare Workers AI Gateway adapter。`classify()` (sync) は config 不在時 fallback、`classifyAsync()` がネットワーク経路。timeout / quota error 時 threshold へ fallback
- `scripts/cf-audit-log/classifier/index.ts` 編集 — factory に 3 候補を追加。`CF_AUDIT_CLASSIFIER=isolation-forest|xgboost|workers-ai` で切替可能。production 既定値は `threshold` 据え置き。model/token env は `CF_AUDIT_IF_MODEL` / `CF_AUDIT_XGB_MODEL` / `CF_AUDIT_WORKERS_AI_URL` / `CF_AUDIT_WORKERS_AI_TOKEN`
- `scripts/cf-audit-log/evaluation/selection-criteria.ts` 新規 — precision ≥ baseline+5pt / recall ≥ baseline / fallbackRate ≤ 1% / latencyP95 ≤ 500ms ゲート。同点時 precision_desc → latencyP95_asc → fallbackRate_asc
- `scripts/cf-audit-log/evaluation/model-comparison.ts` 新規 — 4 classifier を同一 dataset に流し、precision / recall / FP / FN / FP rate / FN rate / fallback rate / latency p50/p95 を JSON + Markdown で出力。CLI として `--compare-models` / `--if-model` / `--xgb-model` / `--workers-ai-url` / `--output-json` / `--output-md` を提供
- `scripts/cf-audit-log/evaluation/training/train-isolation-forest.ts` 新規 — redacted JSONL → `isolation-forest-v1` artifact JSON
- `scripts/cf-audit-log/evaluation/training/train-xgboost.ts` 新規 — redacted JSONL → `xgboost-v1` artifact JSON（gradient boosting・residual leaf）
- `scripts/cf-audit-log/__tests__/{classifier-isolation-forest,classifier-xgboost,classifier-workers-ai,model-comparison,selection-criteria}.test.ts` 新規 — 15 テスト追加
- `tests/fixtures/cf-audit/labeled-90day.jsonl` 新規 — synthetic 90 日相当 720 行 dataset（FU-03-B output と同 schema）
- `tests/fixtures/cf-audit/model-isolation-forest.json` / `model-xgboost.json` / `comparison-baseline-result.json` 新規 — 学習済み artifact + baseline snapshot
- `outputs/phase-11/comparison-metrics.json` / `model-comparison-report.md` 新規 — 比較レポート実体
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` / `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` 編集 — SSOT 同期

### 評価結果（synthetic only）

| classifier | precision | recall | fpRate | fallbackRate | latencyP95(ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| threshold | 0.31 | 1.0 | 0.49 | 0 | 0.005 |
| isolation-forest | 0.18 | 1.0 | 1.0 | 0 | 0.08 |
| xgboost | 1.0 | 1.0 | 0 | 0 | 0.03 |
| workers-ai | 0.31 | 1.0 | 0.49 | 1.0 | 0.003 |

合成データ上は xgboost が選定基準を満たすが **production winner ではない**。Workers AI は本実装では sync comparison path で fallback するため fallbackRate=1.0 として rejection され、async smoke のみを確認している。production 切替は FU-03-D で実施。

### Secret hygiene

raw IP / actor email / token / full UA / bearer header を training artifact、comparison metrics、Markdown report に保存しない。`secret-leakage-grep.ts` を 4 出力に対して exit 0 で確認した。`datasetHash` は SHA-256 の先頭 16 hex に短縮し token-like パターンに引っかからないようにした。

### selection-criteria 仕様

- `precisionMinDelta`: 0.05
- `recallMinAbsolute`: "baseline"
- `fallbackRateMax`: 0.01
- `latencyP95Max`: 500 ms
- tieBreaker: precision_desc → latencyP95_asc → fallbackRate_asc

### Production switch (FU-03-D) で必要な作業

1. FU-03-B redacted 90-day dataset で再 comparison
2. 選定 winner を production secret に投入（`CF_AUDIT_CLASSIFIER`）
3. post-switch 7 日観測 + rollback 訓練
4. SSOT に production winner を記録
