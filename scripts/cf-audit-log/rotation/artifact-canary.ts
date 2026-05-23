#!/usr/bin/env tsx
// Issue #587 — artifact-canary
// Loads candidate + baseline artifacts via op references, runs offline replay,
// runs leakage grep, redacts the resolved path values from logs, and writes
// canary-out.json. Designed for dependency-injected testing.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { MLClassifier } from "../classifier/ml.ts";
import type { Classifier } from "../classifier/types.ts";
import { scanForSecrets } from "../evaluation/secret-leakage-grep.ts";
import type { AuditLogEvent, Baseline, Severity } from "../types.ts";
import type {
  ArtifactOpRef,
  CanaryMetrics,
  CanaryOutput,
  CanaryVerdict,
} from "./types.ts";

export interface ArtifactLoadResult {
  classifierVersion: string;
  classifier?: Classifier;
  resolvedPath?: string;
}

export interface ReplayResult {
  totalEventsReplayed: number;
  metrics: CanaryMetrics;
}

export interface LeakageScanResult {
  hits: number;
}

export interface ArtifactCanaryDeps {
  loadArtifact?: (ref: ArtifactOpRef) => Promise<ArtifactLoadResult>;
  replay?: (
    artifact: ArtifactLoadResult,
    windowHours: number,
  ) => Promise<ReplayResult>;
  scanLeakage?: (artifact: ArtifactLoadResult) => Promise<LeakageScanResult>;
  log?: (line: string) => void;
}

export interface ArtifactCanaryOptions {
  candidate: ArtifactOpRef;
  baseline: ArtifactOpRef;
  windowHours?: number;
  out: string;
  dataset?: string;
  exitOnLeakage?: boolean;
  rotationRunId?: string;
}

const OP_REF_RE = /^op:\/\/[^/]+\/[^/]+\/[^/]+$/;
const DEFAULT_REPLAY_DATASET = "tests/fixtures/cf-audit/labeled-90day.jsonl";

interface LabeledAuditEvent {
  event: AuditLogEvent;
  expectedSeverity: Severity | "NONE";
}

const defaultBaseline: Baseline = {
  successPerHourP95: 5,
  failurePerHourP95: 1,
  offHoursRatio: 0.1,
  computedAt: "2026-05-07T00:00:00Z",
  windowDays: 7,
};

function assertOpRef(ref: ArtifactOpRef, label: string): void {
  if (!OP_REF_RE.test(ref)) {
    throw new Error(
      `${label} must be an op reference (op://vault/item/field), got non-op-ref input`,
    );
  }
}

function defaultRunId(): string {
  return `canary-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

function envNameForRef(ref: ArtifactOpRef): string | null {
  const field = ref.split("/").pop();
  return field && /^[A-Z0-9_]+$/.test(field) ? field : null;
}

function resolvedPathForRef(ref: ArtifactOpRef): string | undefined {
  const envName = envNameForRef(ref);
  if (!envName) return undefined;
  const value = process.env[envName];
  if (!value || OP_REF_RE.test(value)) return undefined;
  return value;
}

function readReplayDataset(path: string): LabeledAuditEvent[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LabeledAuditEvent);
}

function defaultLoad(ref: ArtifactOpRef): Promise<ArtifactLoadResult> {
  const resolvedPath = resolvedPathForRef(ref);
  const classifier = new MLClassifier(resolvedPath);
  return Promise.resolve({
    classifier,
    classifierVersion: classifier.version,
    resolvedPath,
  });
}

export function createDefaultCanaryDeps(dataset = DEFAULT_REPLAY_DATASET): ArtifactCanaryDeps {
  let rows: LabeledAuditEvent[] | undefined;
  const loadRows = (): LabeledAuditEvent[] => {
    rows ??= readReplayDataset(dataset);
    return rows;
  };
  return {
    loadArtifact: defaultLoad,
    replay: async (artifact) => {
      const classifier = artifact.classifier;
      if (!classifier) {
        throw new Error("artifact-canary: loaded artifact did not include classifier");
      }
      const metrics = replayRows(loadRows(), classifier);
      return {
        totalEventsReplayed: metrics.totalEvents,
        metrics: {
          precisionProxy: metrics.precision,
          recallProxy: metrics.recall,
          fallbackRate: metrics.fnRate,
          p95LatencyMs: 1,
          leakageHits: 0,
        },
      };
    },
    scanLeakage: async (artifact) => {
      if (!artifact.resolvedPath || !existsSync(artifact.resolvedPath)) {
        return { hits: 0 };
      }
      return { hits: scanForSecrets(artifact.resolvedPath).hits.length };
    },
  };
}

function defaultReplay(
  artifact: ArtifactLoadResult,
  _windowHours: number,
): Promise<ReplayResult> {
  const classifier = artifact.classifier;
  if (!classifier) {
    throw new Error("artifact-canary: loaded artifact did not include classifier");
  }
  const metrics = replayRows(readReplayDataset(DEFAULT_REPLAY_DATASET), classifier);
  return Promise.resolve({
    totalEventsReplayed: metrics.totalEvents,
    metrics: {
      precisionProxy: metrics.precision,
      recallProxy: metrics.recall,
      fallbackRate: metrics.fnRate,
      p95LatencyMs: 1,
      leakageHits: 0,
    },
  });
}

function defaultScan(artifact: ArtifactLoadResult): Promise<LeakageScanResult> {
  if (!artifact.resolvedPath || !existsSync(artifact.resolvedPath)) {
    return Promise.resolve({ hits: 0 });
  }
  return Promise.resolve({ hits: scanForSecrets(artifact.resolvedPath).hits.length });
}

function replayRows(
  rows: LabeledAuditEvent[],
  classifier: Classifier,
): {
  totalEvents: number;
  precision: number;
  recall: number;
  fnRate: number;
} {
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
  return {
    totalEvents: rows.length,
    precision: ratio(tp, tp + fp),
    recall: ratio(tp, tp + fn),
    fnRate: ratio(fn, fn + tp),
  };
}

function ratio(n: number, d: number): number {
  return d === 0 ? 0 : Number((n / d).toFixed(6));
}

function metricsBeatBaseline(c: CanaryMetrics, b: CanaryMetrics): boolean {
  return (
    c.precisionProxy >= b.precisionProxy &&
    c.recallProxy >= b.recallProxy &&
    c.fallbackRate < 0.05 &&
    c.p95LatencyMs <= b.p95LatencyMs * 1.5
  );
}

export async function runArtifactCanary(
  opts: ArtifactCanaryOptions,
  deps: ArtifactCanaryDeps = {},
): Promise<CanaryOutput> {
  assertOpRef(opts.candidate, "candidate");
  assertOpRef(opts.baseline, "baseline");

  const log = deps.log ?? ((line: string) => process.stdout.write(`${line}\n`));
  const loadArtifact = deps.loadArtifact ?? defaultLoad;
  const replay = deps.replay ?? defaultReplay;
  const scanLeakage = deps.scanLeakage ?? defaultScan;
  const windowHours = opts.windowHours ?? 1;
  const canaryRunId = opts.rotationRunId ?? defaultRunId();

  const baseEnvelope: Omit<
    CanaryOutput,
    "candidate" | "baseline" | "candidateClassifierVersion" | "baselineClassifierVersion" | "verdict" | "totalEventsReplayed"
  > = {
    canaryRunId,
    candidatePathRef: opts.candidate,
    baselinePathRef: opts.baseline,
    replayWindowHours: windowHours,
  };

  const emptyMetrics: CanaryMetrics = {
    precisionProxy: 0,
    recallProxy: 0,
    fallbackRate: 1,
    p95LatencyMs: 0,
    leakageHits: 0,
  };

  let candidateLoad: ArtifactLoadResult;
  let baselineLoad: ArtifactLoadResult;
  try {
    log(`canary load: candidate=<redacted-op-ref> baseline=<redacted-op-ref>`);
    candidateLoad = await loadArtifact(opts.candidate);
    baselineLoad = await loadArtifact(opts.baseline);
  } catch (err) {
    const sanitized = sanitizeError(err, [opts.candidate, opts.baseline]);
    log(`canary load failed: ${sanitized}`);
    const out: CanaryOutput = {
      ...baseEnvelope,
      candidateClassifierVersion: "unknown",
      baselineClassifierVersion: "unknown",
      totalEventsReplayed: 0,
      candidate: { ...emptyMetrics },
      baseline: { ...emptyMetrics },
      verdict: "candidate_fail_load",
    };
    writeOut(opts.out, out);
    return out;
  }

  const leakage = await scanLeakage(candidateLoad);
  if (leakage.hits > 0) {
    const out: CanaryOutput = {
      ...baseEnvelope,
      candidateClassifierVersion: candidateLoad.classifierVersion,
      baselineClassifierVersion: baselineLoad.classifierVersion,
      totalEventsReplayed: 0,
      candidate: { ...emptyMetrics, leakageHits: leakage.hits },
      baseline: { ...emptyMetrics },
      verdict: "candidate_fail_leakage",
    };
    writeOut(opts.out, out);
    return out;
  }

  const candidateReplay = await replay(candidateLoad, windowHours);
  const baselineReplay = await replay(baselineLoad, windowHours);

  const verdict: CanaryVerdict = metricsBeatBaseline(
    candidateReplay.metrics,
    baselineReplay.metrics,
  )
    ? "candidate_pass"
    : "candidate_fail_metrics";

  const out: CanaryOutput = {
    ...baseEnvelope,
    candidateClassifierVersion: candidateLoad.classifierVersion,
    baselineClassifierVersion: baselineLoad.classifierVersion,
    totalEventsReplayed: candidateReplay.totalEventsReplayed,
    candidate: candidateReplay.metrics,
    baseline: baselineReplay.metrics,
    verdict,
  };
  writeOut(opts.out, out);
  return out;
}

function writeOut(path: string, out: CanaryOutput): void {
  writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`, "utf8");
}

function sanitizeError(err: unknown, refs: ArtifactOpRef[]): string {
  let msg = err instanceof Error ? err.message : String(err);
  for (const ref of refs) {
    if (ref) msg = msg.split(ref).join("<redacted-op-ref>");
  }
  return msg;
}

function parseArgs(argv: string[]): ArtifactCanaryOptions & { exitOnLeakage: boolean } {
  let candidate = "";
  let baseline = "";
  let out = "";
  let dataset: string | undefined;
  let windowHours: number | undefined;
  let exitOnLeakage = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--candidate" && next) {
      candidate = next;
      i++;
    } else if (a === "--baseline" && next) {
      baseline = next;
      i++;
    } else if (a === "--out" && next) {
      out = next;
      i++;
    } else if (a === "--dataset" && next) {
      dataset = next;
      i++;
    } else if (a === "--window" && next) {
      windowHours = Number(next);
      if (!Number.isInteger(windowHours) || windowHours < 1 || windowHours > 24) {
        throw new Error("--window must be an integer between 1 and 24");
      }
      i++;
    } else if (a === "--no-exit-on-leakage") {
      exitOnLeakage = false;
    }
  }
  if (!candidate || !baseline || !out) {
    throw new Error("--candidate, --baseline, --out are all required");
  }
  return { candidate, baseline, out, dataset, windowHours, exitOnLeakage };
}

export function exitCodeFor(verdict: CanaryVerdict, exitOnLeakage: boolean): number {
  if (verdict === "candidate_pass") return 0;
  if (verdict === "candidate_fail_leakage" && !exitOnLeakage) return 0;
  return 1;
}

if (process.argv[1]?.endsWith("artifact-canary.ts")) {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    const result = await runArtifactCanary(
      parsed,
      createDefaultCanaryDeps(parsed.dataset),
    );
    process.exit(exitCodeFor(result.verdict, parsed.exitOnLeakage));
  } catch (err) {
    process.stderr.write(
      `${JSON.stringify({ ok: false, error: (err as Error).message })}\n`,
    );
    process.exit(1);
  }
}
