#!/usr/bin/env tsx
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
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

export interface RecoveryAggregateSummary extends AggregateSummary {
  mode: "recovery" | "normal";
  since?: string;
  until?: string;
  leakageHourlyClean: boolean;
  runUrls: string[];
  compareWith1stCycle: {
    snapshotsDelta: number | null;
    fallbackRateDelta: number | null;
    leakageStatusChange: string;
  };
  compareWithBaseline: {
    fallbackRateDelta: number | null;
    p95LatencyDeltaMs: number | null;
  };
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
    .filter((snapshot) => typeof snapshot.hour === "string")
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
  recoveryMode: boolean;
  since?: string;
  runUrls?: string;
  compareFirstCycle?: string;
  compareBaseline?: string;
}

const RECOVERY_DEFAULT_INPUT = "./hourly-snapshots-recovery";
const RECOVERY_DEFAULT_OUT_JSON =
  "outputs/phase-11/evidence/hourly-run-7day-summary-recovery.json";
const NORMAL_DEFAULT_OUT_JSON =
  "outputs/phase-11/evidence/hourly-run-7day-summary.json";

export function resolveOutPath(args: CliArgs): string | undefined {
  if (args.out) return args.out;
  if (args.recoveryMode) return RECOVERY_DEFAULT_OUT_JSON;
  return undefined;
}

function computeUntil(sinceIso: string, hours: number): string {
  const since = new Date(sinceIso);
  if (Number.isNaN(since.getTime())) return sinceIso;
  return new Date(since.getTime() + hours * 3600 * 1000).toISOString();
}

function filterSnapshotsByWindow(
  snapshots: HourlySnapshot[],
  sinceIso: string,
  hours: number,
): HourlySnapshot[] {
  const since = new Date(sinceIso).getTime();
  if (Number.isNaN(since)) {
    throw new Error(`invalid --since=${sinceIso}`);
  }
  const until = since + hours * 3600 * 1000;
  return snapshots.filter((s) => {
    const hour = new Date(s.hour).getTime();
    return !Number.isNaN(hour) && hour >= since && hour < until;
  });
}

function readRunUrls(path: string | undefined): string[] {
  if (!path || !existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cols = line.split(/\t/);
      return cols[1] ?? cols[0];
    })
    .filter((value) => value.startsWith("http"));
}

function readSummary(path: string | undefined): Partial<AggregateSummary> | null {
  if (!path || !existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as Partial<AggregateSummary>;
}

function leakageStatusChange(currentClean: boolean, previous: Partial<AggregateSummary> | null): string {
  if (!previous || typeof previous.leakageHits !== "number") return "unknown";
  const previousClean = previous.leakageHits === 0;
  if (previousClean && currentClean) return "stayed-clean";
  if (!previousClean && currentClean) return "became-clean";
  if (previousClean && !currentClean) return "became-dirty";
  return "stayed-dirty";
}

function buildRecoverySummary(
  summary: AggregateSummary,
  args: CliArgs,
): RecoveryAggregateSummary {
  const firstCycle = readSummary(args.compareFirstCycle);
  const baseline = readSummary(args.compareBaseline);
  const currentClean = summary.leakageHits === 0;
  return {
    ...summary,
    mode: args.recoveryMode ? "recovery" : "normal",
    since: args.since,
    until: args.recoveryMode && args.since ? computeUntil(args.since, 168) : undefined,
    leakageHourlyClean: currentClean,
    runUrls: readRunUrls(args.runUrls),
    compareWith1stCycle: {
      snapshotsDelta:
        typeof firstCycle?.actualSnapshots === "number"
          ? summary.actualSnapshots - firstCycle.actualSnapshots
          : null,
      fallbackRateDelta:
        typeof firstCycle?.fallbackRateMean === "number"
          ? summary.fallbackRateMean - firstCycle.fallbackRateMean
          : null,
      leakageStatusChange: leakageStatusChange(currentClean, firstCycle),
    },
    compareWithBaseline: {
      fallbackRateDelta:
        typeof baseline?.fallbackRateMean === "number"
          ? summary.fallbackRateMean - baseline.fallbackRateMean
          : null,
      p95LatencyDeltaMs:
        typeof baseline?.p95LatencyMedianMs === "number"
          ? summary.p95LatencyMedianMs - baseline.p95LatencyMedianMs
          : null,
    },
  };
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    aggregate: false,
    format: "json",
    requireNonSkeleton: false,
    recoveryMode: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (raw === "--aggregate" || raw.startsWith("--aggregate=")) args.aggregate = true;
    else if (raw === "--require-non-skeleton") args.requireNonSkeleton = true;
    else if (raw === "--recovery-mode" || raw === "--recovery-mode=true") {
      args.recoveryMode = true;
    } else if (raw === "--recovery-mode=false") {
      args.recoveryMode = false;
    } else if (raw === "--since") {
      args.since = argv[++i];
    } else if (raw.startsWith("--since=")) {
      args.since = raw.slice("--since=".length);
    }
    else if (raw === "--hour") args.hour = argv[++i];
    else if (raw.startsWith("--hour=")) args.hour = raw.slice("--hour=".length);
    else if (raw === "--out" || raw === "--output") args.out = argv[++i];
    else if (raw.startsWith("--out=")) args.out = raw.slice("--out=".length);
    else if (raw.startsWith("--output=")) args.out = raw.slice("--output=".length);
    else if (raw === "--input" || raw === "--in") args.input = argv[++i];
    else if (raw.startsWith("--input=")) args.input = raw.slice("--input=".length);
    else if (raw.startsWith("--in=")) args.input = raw.slice("--in=".length);
    else if (raw === "--run-urls") args.runUrls = argv[++i];
    else if (raw.startsWith("--run-urls=")) args.runUrls = raw.slice("--run-urls=".length);
    else if (raw === "--compare-first-cycle") args.compareFirstCycle = argv[++i];
    else if (raw.startsWith("--compare-first-cycle=")) {
      args.compareFirstCycle = raw.slice("--compare-first-cycle=".length);
    }
    else if (raw === "--compare-baseline") args.compareBaseline = argv[++i];
    else if (raw.startsWith("--compare-baseline=")) {
      args.compareBaseline = raw.slice("--compare-baseline=".length);
    }
    else if (raw.startsWith("--analyze-log=")) {
      args.analyzeLog = raw.slice("--analyze-log=".length);
    }
    else if (raw === "--expected-snapshots") {
      args.expectedSnapshots = Number.parseInt(argv[++i], 10);
    }
    else if (raw.startsWith("--expected-snapshots=")) {
      args.expectedSnapshots = Number.parseInt(
        raw.slice("--expected-snapshots=".length),
        10,
      );
    }
    else if (raw === "--window") { i++; continue; }
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
  if (args.recoveryMode && args.aggregate && !args.since) {
    process.stderr.write("since is required in recovery-mode\n");
    process.exit(2);
  }
  if (args.aggregate) {
    const inputDir =
      args.input ?? (args.recoveryMode ? RECOVERY_DEFAULT_INPUT : undefined);
    if (!inputDir) throw new Error("--aggregate requires --input=<dir>");
    const allSnapshots = readSnapshotsFromDir(inputDir);
    const snapshots =
      args.recoveryMode && args.since
        ? filterSnapshotsByWindow(allSnapshots, args.since, 168)
        : allSnapshots;
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
    const enriched = buildRecoverySummary(summary, args);
    const outPath = resolveOutPath(args);
    const out =
      args.format === "markdown"
        ? renderSummaryMarkdown(summary)
        : `${JSON.stringify(enriched, null, 2)}\n`;
    emit(out, outPath);
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
