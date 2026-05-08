# Phase 5: データモデル

## 目的

model artifact JSON / comparison metrics / selection criteria の data schema を確定する。secret leakage 防止のため、artifact 内に raw 値が混入しない不変条件を schema レベルで規定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 1. Isolation Forest model artifact schema

```json
{
  "$schema": "isolation-forest-v1",
  "name": "isolation-forest",
  "version": "1.0.0",
  "trainedAt": "2026-05-08T00:00:00Z",
  "datasetHash": "<sha256 of labeled-90day.jsonl>",
  "params": { "numTrees": 100, "subSampleSize": 256, "seed": 42 },
  "trees": [
    {
      "nodes": [
        { "feature": "ip_24_bucket_hash", "threshold": 0.42, "left": 1, "right": 2 },
        { "leaf": true, "depth": 5 },
        { "leaf": true, "depth": 6 }
      ]
    }
  ],
  "severityThresholds": { "high": 0.75, "medium": 0.5, "low": 0.3 }
}
```

不変条件:
- `feature` は redacted feature 名のみ（IP /24 bucket hash / hour-of-day / action category 等）。raw IP / token / UA を許可しない
- `datasetHash` で training dataset の同一性を保証

## 2. XGBoost model artifact schema

```json
{
  "$schema": "xgboost-v1",
  "name": "xgboost",
  "version": "1.0.0",
  "trainedAt": "2026-05-08T00:00:00Z",
  "datasetHash": "<sha256>",
  "params": { "numRounds": 50, "maxDepth": 6, "learningRate": 0.3, "seed": 42 },
  "baseScore": 0.5,
  "boosters": [
    {
      "tree": [
        { "nodeId": 0, "feature": "hour_of_day", "split": 12, "yes": 1, "no": 2, "missing": 1 },
        { "nodeId": 1, "leaf": -0.12 },
        { "nodeId": 2, "leaf": 0.08 }
      ]
    }
  ],
  "severityThresholds": { "high": 0.75, "medium": 0.5, "low": 0.3 }
}
```

## 3. comparison metrics schema

Phase 4 の JSON schema を正本とする。TS 型は以下:

```ts
interface ClassifierMetrics {
  name: string;
  version: string;
  metrics: {
    precision: number;
    recall: number;
    fp: number; fn: number;
    fpRate: number; fnRate: number;
    fallbackRate: number;
    latencyP50: number;
    latencyP95: number;
  };
}
interface SelectionResult {
  winner: string;
  criteria: SelectionCriteria;
  tieBreaker: ReadonlyArray<'precision_desc' | 'latencyP95_asc' | 'fallbackRate_asc'>;
  rejected: Array<{ name: string; reason: string }>;
}
```

## 4. selection criteria schema

```ts
interface SelectionCriteria {
  precisionMinDelta: number;   // 0.05
  recallMinAbsolute: 'baseline' | number;
  fallbackRateMax: number;     // 0.01
  latencyP95Max: number;       // 500 (ms)
}
```

## 5. labeled dataset (fixture) schema

`tests/fixtures/cf-audit/labeled-90day.jsonl` 1 行あたり:

```json
{
  "eventId": "evt_xxx",
  "occurredAt": "2026-02-08T03:14:15Z",
  "actor_role_hash": "sha256:...",
  "action_category": "secret_rotation",
  "status_class": "5xx",
  "hour_of_day": 3,
  "ip_24_bucket_hash": "sha256:...",
  "expectedSeverity": "HIGH"
}
```

不変条件:
- raw IP / actor_email / token id を含まない（FU-03-B redacted output と同 schema）
- `expectedSeverity` ラベルが必須

## 完了条件

- [ ] 2 model artifact schema 確定
- [ ] comparison metrics TS 型確定
- [ ] selection criteria TS 型確定
- [ ] fixture schema が FU-03-B output と互換

## 出力

- `phase-05.md`

## 参照資料

- `index.md`
- `phase-04.md`
- 親 #515 phase-05（feature schema）

## 統合テスト連携

- Phase 9 で schema validation test を計画

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 の成果物を上流契約として参照する。
