# Phase 4: I/O 契約

## 目的

各 classifier、training script、comparison harness、selection-criteria の入出力契約を確定する。親 #515 の `Classifier` interface との互換性を担保する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## Classifier interface（親 #515 既存・本タスクで再宣言しない）

```ts
interface Classifier {
  readonly name: string;
  readonly version: string;
  classify(input: ClassifierInput): SeverityResult | null;
}

interface SeverityResult {
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  reason: string;
  confidence?: number; // 0..1, ML classifier のみ
}
```

## 3 ML classifier コンストラクタ I/O

| Classifier | コンストラクタ引数 | 内部状態 |
| --- | --- | --- |
| `IsolationForestClassifier` | `(modelPath: string \| null)` | `trees: ITree[]` / `severityThresholds: { high: number; medium: number; low: number }` / `fallback?: ThresholdClassifier` |
| `XGBoostClassifier` | `(modelPath: string \| null)` | `boosters: BoosterTree[]` / `baseScore: number` / `severityThresholds` / `fallback?` |
| `WorkersAIClassifier` | `(gatewayUrl: string \| null, token: string \| null, fetchImpl?: typeof fetch)` | `fetch: typeof fetch` / `timeout: 2000` / `fallback?: ThresholdClassifier` |

## training script I/O

### `train-isolation-forest.ts`

```
入力: --input <labeled.jsonl> --output <model.json> [--seed <int>] [--num-trees 100] [--sub-sample 256]
出力: model artifact JSON (schema は Phase 5)
exit: 0 success / 1 input invalid / 2 leakage detected
```

### `train-xgboost.ts`

```
入力: --input <labeled.jsonl> --output <model.json> [--seed <int>] [--num-rounds 50] [--max-depth 6]
出力: model artifact JSON (schema は Phase 5)
exit: 0 / 1 / 2（同上）
```

## comparison harness I/O

```
CLI: pnpm tsx scripts/cf-audit-log/evaluation/model-comparison.ts \
  --dataset <labeled.jsonl> \
  --threshold-baseline \
  --if-model <model-isolation-forest.json> \
  --xgb-model <model-xgboost.json> \
  --workers-ai-url <url> --workers-ai-token <env-name> \
  --output-json <comparison-metrics.json> \
  --output-md   <model-comparison-report.md>
exit: 0 success / 1 dataset invalid / 2 all classifier fallback
```

## comparison report schema (JSON)

```json
{
  "datasetPath": "tests/fixtures/cf-audit/labeled-90day.jsonl",
  "datasetSize": 12345,
  "generatedAt": "2026-05-08T00:00:00Z",
  "classifiers": [
    {
      "name": "threshold",
      "version": "1.0.0",
      "metrics": {
        "precision": 0.82, "recall": 0.91,
        "fp": 14, "fn": 9,
        "fpRate": 0.012, "fnRate": 0.008,
        "fallbackRate": 0.0,
        "latencyP50": 0.4, "latencyP95": 1.2
      }
    },
    { "name": "isolation-forest", "...": "..." },
    { "name": "xgboost",          "...": "..." },
    { "name": "workers-ai",       "...": "..." }
  ],
  "selection": {
    "winner": "xgboost",
    "criteria": {
      "precisionMinDelta": 0.05,
      "recallMinAbsolute": "baseline",
      "fallbackRateMax": 0.01,
      "latencyP95Max": 500
    },
    "tieBreaker": ["precision_desc", "latencyP95_asc", "fallbackRate_asc"],
    "rejected": [
      { "name": "isolation-forest", "reason": "precision_below_baseline+5pt" },
      { "name": "workers-ai",       "reason": "latencyP95>500ms" }
    ]
  }
}
```

## selection-criteria 関数 I/O

```ts
function selectWinner(
  metrics: ClassifierMetrics[],
  baseline: ClassifierMetrics,
  criteria: SelectionCriteria,
): SelectionResult;
```

## 完了条件

- [ ] 3 ML classifier コンストラクタ署名を確定
- [ ] training script CLI フラグを確定
- [ ] comparison report JSON schema を確定
- [ ] selection-criteria 関数署名を確定

## 出力

- `phase-04.md`

## 参照資料

- `index.md`
- `phase-03.md`
- 親 #515 phase-04（Classifier interface 契約）

## 統合テスト連携

- Phase 9 で各 I/O に対する test ケースを定義

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 の成果物を上流契約として参照する。
