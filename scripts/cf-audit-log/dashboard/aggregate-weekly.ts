#!/usr/bin/env tsx
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { toIsoWeek } from "../observation/post-switch-monitor.ts";
import type { SevenDaySummaryV1, TrendWeek, WeeklyTrend } from "./types.ts";

interface CliArgs {
  input?: string;
  out?: string;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (const raw of argv) {
    if (raw.startsWith("--input=")) args.input = raw.slice("--input=".length);
    else if (raw.startsWith("--in=")) args.input = raw.slice("--in=".length);
    else if (raw.startsWith("--out=")) args.out = raw.slice("--out=".length);
    else if (raw.startsWith("--output=")) args.out = raw.slice("--output=".length);
  }
  return args;
}

function assertNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`invalid weekly summary: ${field} must be a number`);
  }
  return value;
}

function resolveWeekStarting(summary: SevenDaySummaryV1, fileName: string): string {
  if (typeof summary.week_starting === "string" && /^\d{4}-W\d{2}$/.test(summary.week_starting)) {
    return summary.week_starting;
  }
  const generatedAt = summary.generated_at ?? summary.generatedAt;
  if (!generatedAt) {
    throw new Error(`invalid weekly summary ${fileName}: week_starting or generated_at is required`);
  }
  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`invalid weekly summary ${fileName}: generated_at is not ISO date`);
  }
  return toIsoWeek(date);
}

export function parseSummaryJson(raw: string, fileName: string): { week?: TrendWeek; warning?: string } {
  const parsed = JSON.parse(raw) as Partial<SevenDaySummaryV1> & { schema_version?: unknown };
  if (parsed.schema_version === undefined) {
    return { warning: `${fileName}: missing schema_version; skipped legacy summary` };
  }
  if (typeof parsed.schema_version !== "string") {
    throw new Error(`invalid weekly summary ${fileName}: schema_version must be a string`);
  }
  if (parsed.schema_version !== "1.0.0") {
    throw new Error(`unsupported weekly summary ${fileName}: schema_version=${parsed.schema_version}`);
  }
  const week_starting = resolveWeekStarting(parsed as SevenDaySummaryV1, fileName);
  const thresholdSnapshots = assertNumber(parsed.thresholdSnapshots, "thresholdSnapshots");
  const mlSnapshots = assertNumber(parsed.mlSnapshots, "mlSnapshots");
  const period = thresholdSnapshots > 0 && mlSnapshots > 0 ? "mixed" : mlSnapshots > 0 ? "ml" : "threshold";
  return {
    week: {
      week_starting,
      actualSnapshots: assertNumber(parsed.actualSnapshots, "actualSnapshots"),
      expectedSnapshots: assertNumber(parsed.expectedSnapshots, "expectedSnapshots"),
      fallbackRateMean: assertNumber(parsed.fallbackRateMean, "fallbackRateMean"),
      p95LatencyMedianMs: assertNumber(parsed.p95LatencyMedianMs, "p95LatencyMedianMs"),
      issuesOpenedTotal: assertNumber(parsed.issuesOpenedTotal, "issuesOpenedTotal"),
      leakageHits: assertNumber(parsed.leakageHits, "leakageHits"),
      thresholdSnapshots,
      mlSnapshots,
      period,
    },
  };
}

export function aggregateWeeklySummaries(files: Array<{ name: string; content: string }>, now = new Date()): WeeklyTrend {
  const warnings: string[] = [];
  const weeks: TrendWeek[] = [];
  for (const file of files) {
    const result = parseSummaryJson(file.content, file.name);
    if (result.warning) warnings.push(result.warning);
    if (result.week) weeks.push(result.week);
  }
  weeks.sort((a, b) => a.week_starting.localeCompare(b.week_starting));
  return {
    schema_version: "1.0.0",
    generated_at: now.toISOString(),
    source_count: files.length,
    skipped_count: warnings.length,
    warnings,
    weeks,
    metrics: {
      fallback_rate: weeks.map((w) => w.fallbackRateMean),
      p95_latency_ms: weeks.map((w) => w.p95LatencyMedianMs),
      issues_opened: weeks.map((w) => w.issuesOpenedTotal),
      leakage_hits: weeks.map((w) => w.leakageHits),
    },
  };
}

export function readJsonFiles(inputDir: string): Array<{ name: string; content: string }> {
  return readdirSync(inputDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({ name, content: readFileSync(join(inputDir, name), "utf8") }));
}

function emit(content: string, out: string | undefined): void {
  if (!out) {
    process.stdout.write(content.endsWith("\n") ? content : `${content}\n`);
    return;
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
}

export function runCli(argv: string[]): void {
  const args = parseArgs(argv);
  if (!args.input) throw new Error("--input=<dir> is required");
  const trend = aggregateWeeklySummaries(readJsonFiles(args.input));
  for (const warning of trend.warnings) {
    process.stderr.write(`warning: ${warning}\n`);
  }
  emit(`${JSON.stringify(trend, null, 2)}\n`, args.out);
}

const invokedAsCli =
  process.argv[1]?.endsWith("aggregate-weekly.ts") ||
  process.argv[1]?.endsWith("aggregate-weekly.js");
if (invokedAsCli) {
  try {
    runCli(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    process.exit(1);
  }
}
