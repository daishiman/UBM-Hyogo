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

interface AnalyzeSummary {
  totalEvents?: number;
  findings?: number;
  classifierUsed?: ClassifierName;
  classifierVersion?: string;
  fallbackActive?: boolean;
  elapsedMs?: number;
}

export interface AggregateSummary {
  schema_version?: "1.0.0";
  week_starting?: string;
  generated_at?: string;
  expectedSnapshots: number;
  actualSnapshots: number;
  windowHours: number;
  fallbackRateMean: number;
  fallbackRateMax: number;
  issuesOpenedTotal: number;
  p95LatencyMedianMs: number;
  leakageHits: number;
  thresholdSnapshots: number;
  mlSnapshots: number;
}

export function toIsoWeek(date: Date): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function aggregateSnapshots(
  snapshots: HourlySnapshot[],
  expectedSnapshots = snapshots.length,
): AggregateSummary {
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
    expectedSnapshots,
    actualSnapshots: snapshots.length,
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
    `- expected snapshots: ${summary.expectedSnapshots}`,
    `- actual snapshots: ${summary.actualSnapshots}`,
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
  analyzeLog?: string;
  expectedSnapshots?: number;
  requireNonSkeleton: boolean;
  aggregate: boolean;
  format: "json" | "markdown";
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    aggregate: false,
    format: "json",
    requireNonSkeleton: false,
  };
  for (const raw of argv) {
    if (raw === "--aggregate" || raw.startsWith("--aggregate=")) args.aggregate = true;
    else if (raw === "--require-non-skeleton") args.requireNonSkeleton = true;
    else if (raw.startsWith("--hour=")) args.hour = raw.slice("--hour=".length);
    else if (raw.startsWith("--out=")) args.out = raw.slice("--out=".length);
    else if (raw.startsWith("--output=")) args.out = raw.slice("--output=".length);
    else if (raw.startsWith("--input=")) args.input = raw.slice("--input=".length);
    else if (raw.startsWith("--in=")) args.input = raw.slice("--in=".length);
    else if (raw.startsWith("--analyze-log=")) {
      args.analyzeLog = raw.slice("--analyze-log=".length);
    }
    else if (raw.startsWith("--expected-snapshots=")) {
      args.expectedSnapshots = Number.parseInt(
        raw.slice("--expected-snapshots=".length),
        10,
      );
    }
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

function readAnalyzeSummary(logPath: string | undefined): AnalyzeSummary | null {
  if (!logPath) return null;
  const lines = readFileSync(logPath, "utf8").split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]) as AnalyzeSummary & { ok?: boolean };
      if (parsed.ok === true) return parsed;
    } catch {
      continue;
    }
  }
  return null;
}

export function assertNonSkeletonSnapshots(snapshots: HourlySnapshot[]): void {
  const allSkeletonMetrics = snapshots.every(
    (s) =>
      s.totalEvents === 0 &&
      s.issuesOpenedThisHour === 0 &&
      s.fallbackRate === 0 &&
      s.p95LatencyMs === 0,
  );
  if (allSkeletonMetrics) {
    throw new Error(
      "aggregateSnapshots: all snapshots contain skeleton zero metrics; refusing runtime promotion evidence",
    );
  }
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

export function buildSkeletonSnapshot(
  hour: string,
  analyzeSummary: AnalyzeSummary | null = null,
): HourlySnapshot {
  const classifier = (process.env.CF_AUDIT_CLASSIFIER as ClassifierName) ?? "threshold";
  const leakage =
    (process.env.LEAKAGE_GREP_RESULT as LeakageGrepResult) === "dirty"
      ? "dirty"
      : "clean";
  const classifierUsed = analyzeSummary?.classifierUsed ?? classifier;
  return {
    hour,
    classifierUsed,
    classifierVersion:
      analyzeSummary?.classifierVersion ??
      process.env.CF_AUDIT_CLASSIFIER_VERSION ??
      `${classifierUsed}@unknown`,
    totalEvents: analyzeSummary?.totalEvents ?? 0,
    issuesOpenedThisHour: analyzeSummary?.findings ?? 0,
    fallbackRate: analyzeSummary?.fallbackActive ? 1 : 0,
    p95LatencyMs: analyzeSummary?.elapsedMs ?? 0,
    leakageGrepResult: leakage,
  };
}

export function runCli(argv: string[]): void {
  const args = parseArgs(argv);
  if (args.aggregate) {
    if (!args.input) throw new Error("--aggregate requires --input=<dir>");
    const snapshots = readSnapshotsFromDir(args.input);
    if (args.requireNonSkeleton) {
      assertNonSkeletonSnapshots(snapshots);
    }
    const envExpected = process.env.EXPECTED_SNAPSHOTS_7DAY
      ? Number.parseInt(process.env.EXPECTED_SNAPSHOTS_7DAY, 10)
      : undefined;
    const expectedSnapshots = args.expectedSnapshots ?? envExpected;
    const generatedAt = new Date().toISOString();
    const summary: AggregateSummary = {
      schema_version: "1.0.0",
      week_starting: toIsoWeek(new Date(generatedAt)),
      generated_at: generatedAt,
      ...aggregateSnapshots(snapshots, expectedSnapshots),
    };
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
  const snapshot = buildSkeletonSnapshot(args.hour, readAnalyzeSummary(args.analyzeLog));
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
