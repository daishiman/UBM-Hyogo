# Phase 3: 設計

## 目的

3 モデル候補の実装方針 / comparison harness のループ構造 / selection-criteria の判定アルゴリズムを設計する。親 #515 の DI 構造（factory + Classifier interface）を踏襲する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 設計概要

### 1. 3 ML classifier の実装方針

| Classifier | アプローチ | model artifact | fallback |
| --- | --- | --- | --- |
| `IsolationForestClassifier` | pure TS 実装。`itree[]` の depth から anomaly score 計算。score → severity マッピング閾値を artifact に含める | `model-isolation-forest.json`（trees + thresholds） | artifact 不在 / parse error 時 `ThresholdClassifier` |
| `XGBoostClassifier` | 学習済み tree booster を JSON から読み込み、決定パスをたどって score 算出。XGBoost dump_model JSON 形式互換 | `model-xgboost.json`（boosters + base_score） | 同上 |
| `WorkersAIClassifier` | `fetch(CF_AUDIT_WORKERS_AI_URL)` で anomaly scoring API を呼び出し。response.score を severity に map | URL + token のみ（artifact なし） | quota error / 5xx / timeout(>2s) で fallback |

### 2. comparison harness ループ構造

```
for classifier in [threshold, isolation-forest, xgboost, workers-ai]:
  for event in dataset:
    t0 = performance.now()
    result = classifier.classify(extractFeatures(event)) || NONE
    latency = performance.now() - t0
    aggregate(classifier.name, expected=event.label, actual=result, latency, fallback?)
write_json(outputs/phase-11/comparison-metrics.json)
write_md(outputs/phase-11/model-comparison-report.md)
```

### 3. selection-criteria 判定アルゴリズム

```
candidates = filter(metrics, c =>
  c.precision >= baseline.precision + 0.05 &&
  c.recall   >= baseline.recall &&
  c.fallbackRate <= 0.01 &&
  c.latencyP95  <= 500
)
if candidates.empty: winner = baseline (threshold)
else: winner = sortBy(candidates, [-precision, latencyP95, fallbackRate])[0]
```

### 4. training script 設計

- `train-isolation-forest.ts`: dataset を読み込み、`numTrees=100` / `subSampleSize=256` で itree 構築 → JSON serialize
- `train-xgboost.ts`: 本サイクルでは fixture 学習のみ。実装は外部 npm パッケージ `xgboost-node` 経由 or 軽量 GBDT pure TS（`tinygbm` 相当）を選択。serialize は dump_model 互換 JSON

### 5. factory 拡張

```ts
function getClassifier(env): Classifier {
  switch (env.CF_AUDIT_CLASSIFIER) {
    case 'isolation-forest': return new IsolationForestClassifier(env.CF_AUDIT_IF_MODEL);
    case 'xgboost':          return new XGBoostClassifier(env.CF_AUDIT_XGB_MODEL);
    case 'workers-ai':       return new WorkersAIClassifier(env.CF_AUDIT_WORKERS_AI_URL, env.CF_AUDIT_WORKERS_AI_TOKEN);
    case 'ml':               return new MLClassifier(env.ML_MODEL_PATH); // 親 #515 既存
    case 'threshold':
    default:                 return new ThresholdClassifier();
  }
}
```

## 設計上の決定事項

- 全 ML classifier は constructor で artifact ロードを試み、失敗時は `this.fallback = new ThresholdClassifier()` を保持し `classify()` で委譲
- `confidence` フィールドは ML classifier が `[0,1]` を返し、threshold は `null`
- comparison report の Markdown は table 形式（classifier × metric）+ winner section
- training script は `--input` / `--output` / `--seed` を必須 flag に

## 完了条件

- [ ] 3 classifier の class 設計（コンストラクタ / classify / fallback）を `phase-03.md` に記述
- [ ] comparison harness のループ構造を疑似コードで記述
- [ ] selection-criteria の判定ロジックを定式化
- [ ] training script の I/O を確定

## 出力

- `phase-03.md`

## 参照資料

- `index.md`
- `phase-01.md` ・ `phase-02.md`
- 親 #515 phase-03（classifier 抽象設計）

## 統合テスト連携

- Phase 9 でこれらの設計に対する test 設計を作成

## 依存Phase参照

Phase 1 / Phase 2 の成果物を上流契約として参照する。
