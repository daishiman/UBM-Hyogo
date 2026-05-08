#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { IsolationForestClassifier } from "../classifier/isolation-forest.ts";
import { ThresholdClassifier } from "../classifier/threshold.ts";
import { WorkersAIClassifier } from "../classifier/workers-ai.ts";
import { XGBoostClassifier } from "../classifier/xgboost.ts";
import type { Classifier } from "../classifier/types.ts";
import { parseArgs } from "../cli-args.ts";
import type { AuditLogEvent, Baseline, Severity } from "../types.ts";
import {
  DEFAULT_CRITERIA,
  selectWinner,
  type ClassifierMetrics,
  type SelectionCriteria,
  type SelectionResult,
} from "./selection-criteria.ts";

export interface LabeledEvent {
  readonly event: AuditLogEvent;
  readonly expectedSeverity: Severity | "NONE";
}

export interface ComparisonReport {
  readonly datasetPath: string;
  readonly datasetSize: number;
  readonly generatedAt: string;
  readonly classifiers: ReadonlyArray<ClassifierMetrics>;
  readonly selection: SelectionResult;
}

const defaultBaseline: Baseline = {
  successPerHourP95: 5,
  failurePerHourP95: 1,
  offHoursRatio: 0.1,
  computedAt: "2026-05-07T00:00:00Z",
  windowDays: 7,
};

export function readDataset(path: string): LabeledEvent[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LabeledEvent);
}

export function evaluateClassifier(
  rows: ReadonlyArray<LabeledEvent>,
  classifier: Classifier,
): ClassifierMetrics {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  let fallback = 0;
  const latencies: number[] = [];
  for (const row of rows) {
    const start = performance.now();
    const result = classifier.classify({
      event: row.event,
      baseline: defaultBaseline,
      context: {
        githubIpRanges: ["140.82.112.0/20", "192.30.252.0/22"],
        businessHoursJst: { start: 9, end: 19 },
        recentFailuresInHour: row.event.action.result_code === 403 ? 10 : 0,
        rotationWindowMs: null,
        failureSpikeMultiplier: 1.5,
      },
    });
    latencies.push(performance.now() - start);
    if (
      classifier.fallbackActive ||
      (result?.reason && /fallback|config-missing/.test(result.reason))
    ) {
      fallback++;
    }
    const expected = row.expectedSeverity !== "NONE";
    const predicted = result !== null;
    if (expected && predicted) tp++;
    else if (!expected && predicted) fp++;
    else if (expected && !predicted) fn++;
    else tn++;
  }
  const total = rows.length;
  return {
    name: classifier.name,
    version: classifier.version,
    metrics: {
      precision: ratio(tp, tp + fp),
      recall: ratio(tp, tp + fn),
      fp,
      fn,
      fpRate: ratio(fp, fp + tn),
      fnRate: ratio(fn, fn + tp),
      fallbackRate: ratio(fallback, total),
      latencyP50: percentile(latencies, 0.5),
      latencyP95: percentile(latencies, 0.95),
    },
  };
}

function ratio(n: number, d: number): number {
  return d === 0 ? 0 : Number((n / d).toFixed(6));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return Number((sorted[idx] ?? 0).toFixed(4));
}

export interface RunComparisonOptions {
  readonly datasetPath: string;
  readonly ifModel?: string | null;
  readonly xgbModel?: string | null;
  readonly workersAiUrl?: string | null;
  readonly workersAiToken?: string | null;
  readonly criteria?: SelectionCriteria;
}

export function runComparison(opts: RunComparisonOptions): ComparisonReport {
  const rows = readDataset(opts.datasetPath);
  const classifiers: Classifier[] = [
    new ThresholdClassifier(),
    new IsolationForestClassifier(opts.ifModel ?? null),
    new XGBoostClassifier(opts.xgbModel ?? null),
    new WorkersAIClassifier(opts.workersAiUrl ?? null, opts.workersAiToken ?? null),
  ];
  const metrics = classifiers.map((c) => evaluateClassifier(rows, c));
  const baseline = metrics.find((m) => m.name === "threshold");
  if (!baseline) throw new Error("threshold baseline missing");
  const selection = selectWinner(metrics, baseline, opts.criteria ?? DEFAULT_CRITERIA);
  return {
    datasetPath: opts.datasetPath,
    datasetSize: rows.length,
    generatedAt: new Date().toISOString(),
    classifiers: metrics,
    selection,
  };
}

export function renderMarkdown(report: ComparisonReport): string {
  const head =
    "| classifier | version | precision | recall | fp | fn | fpRate | fnRate | fallbackRate | latencyP50 | latencyP95 |\n" +
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |";
  const rows = report.classifiers
    .map((c) => {
      const m = c.metrics;
      return `| ${c.name} | ${c.version} | ${m.precision} | ${m.recall} | ${m.fp} | ${m.fn} | ${m.fpRate} | ${m.fnRate} | ${m.fallbackRate} | ${m.latencyP50} | ${m.latencyP95} |`;
    })
    .join("\n");
  const rejected = report.selection.rejected
    .map((r) => `- ${r.name}: ${r.reason}`)
    .join("\n");
  return [
    `# Model Comparison Report`,
    ``,
    `- dataset: \`${report.datasetPath}\``,
    `- size: ${report.datasetSize}`,
    `- generated: ${report.generatedAt}`,
    ``,
    `## Metrics`,
    ``,
    head,
    rows,
    ``,
    `## Selection`,
    ``,
    `- winner: **${report.selection.winner ?? "NONE"}**`,
    `- criteria: ${JSON.stringify(report.selection.criteria)}`,
    `- tieBreaker: ${report.selection.tieBreaker.join(" → ")}`,
    ``,
    `### Rejected`,
    ``,
    rejected || "_none_",
    ``,
  ].join("\n");
}

if (process.argv[1]?.endsWith("model-comparison.ts")) {
  const args = parseArgs(process.argv.slice(2));
  const dataset =
    typeof args["compare-models"] === "string"
      ? args["compare-models"]
      : typeof args.dataset === "string"
        ? args.dataset
        : null;
  if (!dataset) {
    process.stderr.write("--compare-models <dataset.jsonl> required\n");
    process.exit(1);
  }
  const report = runComparison({
    datasetPath: dataset,
    ifModel: typeof args["if-model"] === "string" ? args["if-model"] : null,
    xgbModel: typeof args["xgb-model"] === "string" ? args["xgb-model"] : null,
    workersAiUrl:
      typeof args["workers-ai-url"] === "string" ? args["workers-ai-url"] : null,
    workersAiToken:
      typeof args["workers-ai-token"] === "string"
        ? args["workers-ai-token"]
        : process.env.CF_AUDIT_WORKERS_AI_TOKEN ?? null,
  });
  if (typeof args["output-json"] === "string") {
    writeFileSync(args["output-json"], `${JSON.stringify(report, null, 2)}\n`);
  }
  if (typeof args["output-md"] === "string") {
    writeFileSync(args["output-md"], renderMarkdown(report));
  }
  if (typeof args["output-json"] !== "string" && typeof args["output-md"] !== "string") {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
}
