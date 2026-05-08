#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { getClassifier } from "../classifier/index.ts";
import type { Classifier } from "../classifier/types.ts";
import { parseArgs } from "../cli-args.ts";
import type { AuditLogEvent, Baseline, Severity } from "../types.ts";

export interface LabeledAuditEvent {
  event: AuditLogEvent;
  expectedSeverity: Severity | "NONE";
}

export interface ReplayMetrics {
  classifier: string;
  version: string;
  totalEvents: number;
  labeledAnomalies: number;
  predictedAnomalies: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
  parseErrors: number;
  precision: number;
  recall: number;
  fpRate: number;
  fnRate: number;
}

const defaultBaseline: Baseline = {
  successPerHourP95: 5,
  failurePerHourP95: 1,
  offHoursRatio: 0.1,
  computedAt: "2026-05-07T00:00:00Z",
  windowDays: 7,
};

export function replay(
  rows: LabeledAuditEvent[],
  classifier: Classifier,
): ReplayMetrics {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (const row of rows) {
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
    const expected = row.expectedSeverity !== "NONE";
    const predicted = result !== null;
    if (expected && predicted) tp++;
    else if (!expected && predicted) fp++;
    else if (expected && !predicted) fn++;
    else tn++;
  }
  const total = rows.length;
  return {
    classifier: classifier.name,
    version: classifier.version,
    totalEvents: total,
    labeledAnomalies: tp + fn,
    predictedAnomalies: tp + fp,
    truePositive: tp,
    falsePositive: fp,
    falseNegative: fn,
    trueNegative: tn,
    parseErrors: 0,
    precision: ratio(tp, tp + fp),
    recall: ratio(tp, tp + fn),
    fpRate: ratio(fp, fp + tn),
    fnRate: ratio(fn, fn + tp),
  };
}

function readDataset(path: string): LabeledAuditEvent[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LabeledAuditEvent);
}

function ratio(n: number, d: number): number {
  return d === 0 ? 0 : Number((n / d).toFixed(6));
}

if (process.argv[1]?.endsWith("offline-replay.ts")) {
  const args = parseArgs(process.argv.slice(2));
  const dataset = typeof args.evaluate === "string" ? args.evaluate : null;
  if (!dataset) throw new Error("--evaluate <dataset.jsonl> is required");
  const classifier = getClassifier({
    CF_AUDIT_CLASSIFIER: typeof args.classifier === "string"
      ? args.classifier
      : process.env.CF_AUDIT_CLASSIFIER,
    ML_MODEL_PATH: typeof args["ml-model-path"] === "string"
      ? args["ml-model-path"]
      : process.env.ML_MODEL_PATH,
    CF_AUDIT_IF_MODEL: typeof args["if-model"] === "string"
      ? args["if-model"]
      : process.env.CF_AUDIT_IF_MODEL,
    CF_AUDIT_XGB_MODEL: typeof args["xgb-model"] === "string"
      ? args["xgb-model"]
      : process.env.CF_AUDIT_XGB_MODEL,
    CF_AUDIT_WORKERS_AI_URL: typeof args["workers-ai-url"] === "string"
      ? args["workers-ai-url"]
      : process.env.CF_AUDIT_WORKERS_AI_URL,
    CF_AUDIT_WORKERS_AI_TOKEN: typeof args["workers-ai-token"] === "string"
      ? args["workers-ai-token"]
      : process.env.CF_AUDIT_WORKERS_AI_TOKEN,
  });
  const metrics = replay(readDataset(dataset), classifier);
  const json = `${JSON.stringify(metrics, null, 2)}\n`;
  if (typeof args.out === "string") writeFileSync(args.out, json);
  else process.stdout.write(json);
}
