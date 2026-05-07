# Phase 6: 関数シグネチャと擬似コード

## 目的

実装対象モジュールの関数シグネチャと主要処理の擬似コードを確定する。

## 関数シグネチャ

### `scripts/cf-audit-log/classifier/types.ts`

```ts
import type { AuditLogEvent, Baseline, Severity } from '../types';
import type { ClassifierContext } from '../severity-classifier';

export interface SeverityResult {
  severity: Severity;
  confidence: number;
  classifierUsed: 'threshold' | 'ml';
  classifierVersion: string;
  reason: string;
}

export interface ClassifierInput {
  event: AuditLogEvent;
  baseline: Baseline | null;
  context: ClassifierContext;
}

export interface Classifier {
  readonly name: 'threshold' | 'ml';
  readonly version: string;
  classify(input: ClassifierInput): SeverityResult | null;
}
```

### `scripts/cf-audit-log/classifier/threshold.ts`

```ts
import type { Classifier, SeverityResult } from './types';
import { classifySeverity as legacyClassify } from '../severity-classifier';

export class ThresholdClassifier implements Classifier {
  readonly name = 'threshold' as const;
  readonly version = 'threshold@1.0.0';

  classify(input: ClassifierInput): SeverityResult | null {
    const legacy = legacyClassify(input.event, input.baseline, input.context);
    if (!legacy) return null;
    return {
      severity: legacy.severity,
      confidence: 1.0,
      classifierUsed: 'threshold',
      classifierVersion: this.version,
      reason: legacy.reason,
    };
  }
}
```

### `scripts/cf-audit-log/classifier/ml.ts`

```ts
import type { Classifier, SeverityResult } from './types';
import { ThresholdClassifier } from './threshold';
import { extractFeatures } from '../features/extract';

export class MLClassifier implements Classifier {
  readonly name = 'ml' as const;
  readonly version = 'ml@v0.0.0-skeleton-fallback';
  private readonly fallback = new ThresholdClassifier();

  constructor(private readonly modelPath: string | undefined) {
    void modelPath; // post-gate model loading is intentionally not implemented in this cycle
  }

  classify(input: ClassifierInput): SeverityResult | null {
    const r = this.fallback.classify(input);
    if (!r) return null;
    return { ...r, classifierUsed: 'ml', classifierVersion: this.version, reason: `${r.reason}; ml-fallback-to-threshold` };
  }
}
```

### `scripts/cf-audit-log/classifier/index.ts`

```ts
export function getClassifier(env: {
  CF_AUDIT_CLASSIFIER?: string;
  ML_MODEL_PATH?: string;
}): Classifier {
  if (env.CF_AUDIT_CLASSIFIER === 'ml') {
    return new MLClassifier(env.ML_MODEL_PATH);
  }
  return new ThresholdClassifier();
}
```

### `scripts/cf-audit-log/features/extract.ts`

```ts
import { createHash } from 'node:crypto';
import type { AuditEvent } from '../types';
import type { RedactedFeatures } from './schema';

export function extractFeatures(
  event: AuditEvent,
  opts: { redactSecret: string }
): RedactedFeatures {
  return {
    ipBucket: bucketIp(event.actor?.ip),
    hourOfDay: new Date(event.when).getUTCHours(),
    dayOfWeek: new Date(event.when).getUTCDay(),
    actionCategory: categorizeAction(event.action?.type),
    statusClass: classifyStatus(event.metadata?.statusCode),
    actorRoleHash: createHash('sha256')
      .update(opts.redactSecret + (event.actor?.email ?? ''))
      .digest('hex')
      .slice(0, 16),
    userAgentCategory: categorizeUA(event.actor?.userAgent),
    tokenIdPresent: Boolean(event.actor?.tokenId),
  };
}
```

### `scripts/cf-audit-log/evaluation/offline-replay.ts`

```ts
export interface ReplayMetrics {
  classifier: 'threshold' | 'ml';
  version: string;
  totalEvents: number;
  labeledAnomalies: number;
  predictedAnomalies: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
  precision: number;
  recall: number;
  fpRate: number;
  fnRate: number;
}

export function replay(
  dataset: Array<{ event: AuditEvent; expectedSeverity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' }>,
  classifier: Classifier
): ReplayMetrics { /* ... */ }
```

### `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts`

```ts
export function scanForSecrets(filePath: string): {
  hits: Array<{ line: number; pattern: string; sample: string }>;
} { /* ... */ }
// CLI: exit 1 if hits.length > 0
```

### `scripts/cf-audit-log/analyze.ts` 差替（擬似コード）

```ts
// Before:
//   const severity = classifySeverity(event);
// After:
const classifier = getClassifier(process.env);
const result = classifier.classify(event);
// → result.severity, result.classifierUsed, result.classifierVersion, result.confidence を D1 insert / Issue 起票で使う
```

## 完了条件

- [ ] 上記 8 モジュールのシグネチャを `outputs/phase-06/main.md` に記述
- [ ] `analyze.ts` の差替 diff の擬似コードを記述
- [ ] `extractFeatures` の各 helper（bucketIp / categorizeAction / classifyStatus / categorizeUA）の挙動を表化

## 出力

- `outputs/phase-06/main.md`

## 参照資料

- `index.md`
- `phase-03.md` ・ `phase-04.md` ・ `phase-05.md`

## 統合テスト連携

- Phase 9 で各シグネチャを test 単位として登録

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 06-1 | この Phase の契約を確定する |
| 06-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
