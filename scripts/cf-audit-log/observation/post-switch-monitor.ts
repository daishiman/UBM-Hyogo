#!/usr/bin/env tsx
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";

export type ClassifierName = "threshold" | "ml";
export type LeakageGrepResult = "clean" | "dirty";

export interface HourlySnapshot {
  hour: string;
  classifierUsed: ClassifierName;
  classifierVersion: string;
  totalEvents: number;
  issuesOpenedThisHour: number;
  fallbackRate: number;
  p95LatencyMs: number;
  leakageGrepResult: LeakageGrepResult;
  previousThresholdBaseline?: {
    issuesPerHourMean: number;
    issuesPerHourStdev: number;
  };
}

export interface AggregateSummary {
  windowHours: number;
  fallbackRateMean: number;
  fallbackRateMax: number;
  issuesOpenedTotal: number;
  p95LatencyMedianMs: number;
  leakageHits: number;
  thresholdSnapshots: number;
  mlSnapshots: number;
}

export function aggregateSnapshots(snapshots: HourlySnapshot[]): AggregateSummary {
  if (snapshots.length === 0) {
    throw new Error("aggregateSnapshots: empty input");
  }
  const fallbacks = snapshots.map((s) => s.fallbackRate);
  const latencies = [...snapshots.map((s) => s.p95LatencyMs)].sort((a, b) => a - b);
  const median =
    latencies.length % 2 === 1
      ? latencies[(latencies.length - 1) / 2]
      : (latencies[latencies.length / 2 - 1] + latencies[latencies.length / 2]) / 2;
  return {
    windowHours: snapshots.length,
    fallbackRateMean:
      fallbacks.reduce((acc, x) => acc + x, 0) / fallbacks.length,
    fallbackRateMax: Math.max(...fallbacks),
    issuesOpenedTotal: snapshots.reduce(
      (acc, s) => acc + s.issuesOpenedThisHour,
      0,
    ),
    p95LatencyMedianMs: median,
    leakageHits: snapshots.filter((s) => s.leakageGrepResult === "dirty").length,
    thresholdSnapshots: snapshots.filter((s) => s.classifierUsed === "threshold").length,
    mlSnapshots: snapshots.filter((s) => s.classifierUsed === "ml").length,
  };
}

export function readSnapshotsFromDir(dir: string): HourlySnapshot[] {
  const entries = readdirSync(dir).filter((f) => f.endsWith(".json"));
  return entries
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as HourlySnapshot)
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

export function renderSummaryMarkdown(summary: AggregateSummary): string {
  return [
    "# CF Audit ML Production Switch — Observation Summary",
    "",
    `- window hours: ${summary.windowHours}`,
    `- fallback rate (mean): ${(summary.fallbackRateMean * 100).toFixed(2)}%`,
    `- fallback rate (max): ${(summary.fallbackRateMax * 100).toFixed(2)}%`,
    `- issues opened (total): ${summary.issuesOpenedTotal}`,
    `- p95 latency (median ms): ${summary.p95LatencyMedianMs}`,
    `- leakage hits: ${summary.leakageHits}`,
    `- ml snapshots / threshold snapshots: ${summary.mlSnapshots} / ${summary.thresholdSnapshots}`,
    "",
  ].join("\n");
}

interface CliArgs {
  hour?: string;
  out?: string;
  input?: string;
  aggregate: boolean;
  format: "json" | "markdown";
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { aggregate: false, format: "json" };
  for (const raw of argv) {
    if (raw === "--aggregate" || raw.startsWith("--aggregate=")) args.aggregate = true;
    else if (raw.startsWith("--hour=")) args.hour = raw.slice("--hour=".length);
    else if (raw.startsWith("--out=")) args.out = raw.slice("--out=".length);
    else if (raw.startsWith("--output=")) args.out = raw.slice("--output=".length);
    else if (raw.startsWith("--input=")) args.input = raw.slice("--input=".length);
    else if (raw.startsWith("--in=")) args.input = raw.slice("--in=".length);
    else if (raw.startsWith("--window=")) {
      // Accepted for runbook compatibility. The aggregate window is inferred from input files.
      continue;
    }
    else if (raw.startsWith("--format=")) {
      const v = raw.slice("--format=".length);
      if (v !== "json" && v !== "markdown") {
        throw new Error(`unsupported --format=${v}`);
      }
      args.format = v;
    }
  }
  return args;
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

function emit(content: string, out: string | undefined): void {
  if (out) {
    ensureDir(out);
    writeFileSync(out, content);
    return;
  }
  process.stdout.write(content.endsWith("\n") ? content : `${content}\n`);
}

export function buildSkeletonSnapshot(hour: string): HourlySnapshot {
  const classifier = (process.env.CF_AUDIT_CLASSIFIER as ClassifierName) ?? "threshold";
  const leakage =
    (process.env.LEAKAGE_GREP_RESULT as LeakageGrepResult) === "dirty"
      ? "dirty"
      : "clean";
  return {
    hour,
    classifierUsed: classifier,
    classifierVersion:
      process.env.CF_AUDIT_CLASSIFIER_VERSION ?? `${classifier}@unknown`,
    totalEvents: 0,
    issuesOpenedThisHour: 0,
    fallbackRate: 0,
    p95LatencyMs: 0,
    leakageGrepResult: leakage,
  };
}

export function runCli(argv: string[]): void {
  const args = parseArgs(argv);
  if (args.aggregate) {
    if (!args.input) throw new Error("--aggregate requires --input=<dir>");
    const snapshots = readSnapshotsFromDir(args.input);
    const summary = aggregateSnapshots(snapshots);
    const out =
      args.format === "markdown"
        ? renderSummaryMarkdown(summary)
        : `${JSON.stringify(summary, null, 2)}\n`;
    emit(out, args.out);
    return;
  }
  if (!args.hour) {
    throw new Error("--hour=<ISO8601> is required when not --aggregate");
  }
  const snapshot = buildSkeletonSnapshot(args.hour);
  emit(`${JSON.stringify(snapshot, null, 2)}\n`, args.out);
}

const invokedAsCli =
  process.argv[1]?.endsWith("post-switch-monitor.ts") ||
  process.argv[1]?.endsWith("post-switch-monitor.js");
if (invokedAsCli) {
  try {
    runCli(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    process.exit(1);
  }
}
