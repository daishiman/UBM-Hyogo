# Phase 6: 関数シグネチャと擬似コード

## 目的

3 ML classifier / training script / comparison harness / selection-criteria の関数シグネチャと擬似コードを確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 1. IsolationForestClassifier

```ts
export class IsolationForestClassifier implements Classifier {
  readonly name = 'isolation-forest';
  readonly version: string;
  private trees?: ITree[];
  private thresholds?: SeverityThresholds;
  private fallback = new ThresholdClassifier();

  constructor(modelPath: string | null) {
    if (!modelPath) return;
    try {
      const a = readArtifact(modelPath);
      this.trees = a.trees;
      this.thresholds = a.severityThresholds;
      this.version = a.version;
    } catch (e) {
      logFallback('isolation-forest', e);
      // trees / thresholds undefined → classify falls back
    }
  }

  classify(input: ClassifierInput): SeverityResult | null {
    if (!this.trees || !this.thresholds) return this.fallback.classify(input);
    const score = anomalyScore(this.trees, vectorize(input)); // [0,1]
    return mapToSeverity(score, this.thresholds);
  }
}
```

## 2. XGBoostClassifier

```ts
export class XGBoostClassifier implements Classifier {
  readonly name = 'xgboost';
  readonly version: string;
  private boosters?: BoosterTree[];
  private baseScore?: number;
  private thresholds?: SeverityThresholds;
  private fallback = new ThresholdClassifier();

  constructor(modelPath: string | null) {
    if (!modelPath) return;
    try {
      const a = readArtifact(modelPath);
      this.boosters = a.boosters;
      this.baseScore = a.baseScore;
      this.thresholds = a.severityThresholds;
      this.version = a.version;
    } catch { /* fallback */ }
  }

  classify(input: ClassifierInput): SeverityResult | null {
    if (!this.boosters || this.baseScore == null) return this.fallback.classify(input);
    const v = vectorize(input);
    const raw = this.boosters.reduce((s, b) => s + traversePath(b, v), this.baseScore);
    const prob = sigmoid(raw);
    return mapToSeverity(prob, this.thresholds!);
  }
}
```

## 3. WorkersAIClassifier

```ts
export class WorkersAIClassifier implements Classifier {
  readonly name = 'workers-ai';
  readonly version = '1.0.0';
  private fetch: typeof fetch;
  private fallback = new ThresholdClassifier();

  constructor(
    private readonly url: string | null,
    private readonly token: string | null,
    fetchImpl?: typeof fetch,
  ) { this.fetch = fetchImpl ?? globalThis.fetch; }

  async classify(input: ClassifierInput): Promise<SeverityResult | null> {
    if (!this.url || !this.token) return this.fallback.classify(input);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2000);
      const r = await this.fetch(this.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
        body: JSON.stringify(redactedPayload(input)),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!r.ok) return this.fallback.classify(input);
      const j = await r.json() as { score: number };
      return mapToSeverity(j.score, DEFAULT_THRESHOLDS);
    } catch {
      return this.fallback.classify(input);
    }
  }
}
```

> 注: `Classifier.classify` が同期型のため、`workers-ai` のみ async 化する場合は型側に `Promise<SeverityResult | null>` を許容するユニオンを親 #515 で導入済みかを Phase 7 で確認し、未導入なら本タスクで `AsyncClassifier` を別 interface として追加する（comparison harness は Promise.all で集約）。

## 4. training script: train-isolation-forest

```ts
async function main() {
  const args = parseArgs(process.argv);
  const dataset = readJsonl(args.input);
  validateRedacted(dataset); // exit 2 on leakage
  const trees = buildITrees(dataset.map(vectorize), {
    numTrees: args.numTrees ?? 100,
    subSample: args.subSample ?? 256,
    seed: args.seed ?? 42,
  });
  const thresholds = calibrateThresholds(trees, dataset);
  const artifact = {
    $schema: 'isolation-forest-v1',
    name: 'isolation-forest',
    version: '1.0.0',
    trainedAt: new Date().toISOString(),
    datasetHash: sha256File(args.input),
    params: { numTrees: args.numTrees, subSampleSize: args.subSample, seed: args.seed },
    trees, severityThresholds: thresholds,
  };
  writeJson(args.output, artifact);
  await runLeakageGrep(args.output); // exit 2 on leakage
}
```

## 5. training script: train-xgboost

```ts
// 構造は train-isolation-forest と同型。boosters 構築は外部 GBDT 実装に委譲。
```

## 6. model-comparison harness

```ts
async function compareModels(opts: CompareOptions): Promise<ComparisonReport> {
  const dataset = readJsonl(opts.dataset);
  const classifiers: Classifier[] = [
    new ThresholdClassifier(),
    new IsolationForestClassifier(opts.ifModel),
    new XGBoostClassifier(opts.xgbModel),
    new WorkersAIClassifier(opts.workersAiUrl, opts.workersAiToken),
  ];
  const results = [];
  for (const c of classifiers) {
    const m = await runReplay(c, dataset);
    results.push({ name: c.name, version: c.version, metrics: m });
  }
  const baseline = results.find(r => r.name === 'threshold')!;
  const selection = selectWinner(results, baseline, DEFAULT_CRITERIA);
  return { datasetPath: opts.dataset, datasetSize: dataset.length, classifiers: results, selection, generatedAt: new Date().toISOString() };
}
```

## 7. selection-criteria

```ts
export function selectWinner(
  results: ClassifierMetrics[],
  baseline: ClassifierMetrics,
  criteria: SelectionCriteria,
): SelectionResult {
  const candidates = results.filter(r => r.name !== baseline.name).filter(r =>
    r.metrics.precision >= baseline.metrics.precision + criteria.precisionMinDelta &&
    r.metrics.recall    >= baseline.metrics.recall &&
    r.metrics.fallbackRate <= criteria.fallbackRateMax &&
    r.metrics.latencyP95   <= criteria.latencyP95Max,
  );
  if (candidates.length === 0) {
    return { winner: baseline.name, criteria, tieBreaker: TIE_BREAKER, rejected: results.filter(r => r.name !== baseline.name).map(r => ({ name: r.name, reason: rejectReason(r, baseline, criteria) })) };
  }
  candidates.sort((a, b) =>
    b.metrics.precision - a.metrics.precision ||
    a.metrics.latencyP95 - b.metrics.latencyP95 ||
    a.metrics.fallbackRate - b.metrics.fallbackRate
  );
  return { winner: candidates[0].name, criteria, tieBreaker: TIE_BREAKER, rejected: results.filter(r => r.name !== candidates[0].name && r.name !== baseline.name).map(r => ({ name: r.name, reason: rejectReason(r, baseline, criteria) })) };
}
```

## 完了条件

- [ ] 3 ML classifier の class 設計を擬似コードで確定
- [ ] training script 2 本のシグネチャを確定
- [ ] comparison harness のループを擬似コードで確定
- [ ] selection-criteria のソートと filter 仕様を確定

## 出力

- `phase-06.md`

## 参照資料

- `index.md`
- `phase-04.md` ・ `phase-05.md`

## 統合テスト連携

- Phase 9 で各関数の test 観点を定義

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 の成果物を上流契約として参照する。
