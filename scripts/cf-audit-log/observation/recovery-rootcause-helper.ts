#!/usr/bin/env tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import process from "node:process";

type Classification =
  | "production-code"
  | "infrastructure"
  | "configuration"
  | "unknown";

export interface HourlyRunEntry {
  hour: string;
  runUrl: string;
  conclusion: "success" | "failure" | "cancelled" | "skipped" | "neutral" | string;
}

export interface RootcauseInput {
  since: string;
  cycle?: number;
  parentSummaryMissing: boolean;
  classification: Classification;
  missingHours: HourlyRunEntry[];
  productionCodeTargets?: string[];
  escalationContact?: string;
}

export function renderRootcauseMarkdown(input: RootcauseInput): string {
  const detected = new Date().toISOString();
  const header = [
    "---",
    `classification: ${input.classification}`,
    `detected_at: ${detected}`,
    `d_prime_zero: ${input.since}`,
    `cycle: ${input.cycle ?? 2}`,
    `parent_summary_json: ${input.parentSummaryMissing ? "missing" : "present"}`,
    "---",
    "",
  ];
  const missingTable = [
    "## 1 周目 欠損 hour 一覧",
    "",
    "| hour (UTC) | run URL | conclusion | root cause 候補 |",
    "| --- | --- | --- | --- |",
    ...(input.missingHours.length === 0
      ? ["| (none) | - | - | - |"]
      : input.missingHours.map(
          (r) =>
            `| ${r.hour} | ${r.runUrl} | ${r.conclusion} | ${input.classification} |`,
        )),
    "",
  ];
  const fixSection =
    input.classification === "production-code"
      ? [
          "## 修正方針 (production-code 分類)",
          "",
          "- 対象ファイル:",
          ...(input.productionCodeTargets ?? ["(未確定)"]).map((p) => `  - ${p}`),
          "- 想定 PR: PR-A",
          "",
        ]
      : [];
  const escalationSection =
    input.classification === "unknown"
      ? [
          "## escalation (unknown 分類)",
          "",
          `- 連絡先 / Issue 起票先: ${input.escalationContact ?? "(未確定)"}`,
          "",
        ]
      : [];
  return [
    ...header,
    ...missingTable,
    ...fixSection,
    ...escalationSection,
  ].join("\n");
}

interface CliArgs {
  since?: string;
  out: string;
  markMissingParentSummary: boolean;
  classification: Classification;
  runsJson?: string;
  parentSummary?: string;
  productionCodeTarget?: string[];
  escalationContact?: string;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    out: "outputs/phase-11/evidence/recovery-rootcause.md",
    markMissingParentSummary: false,
    classification: "unknown",
    productionCodeTarget: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (raw === "--since") args.since = argv[++i];
    else if (raw.startsWith("--since=")) args.since = raw.slice("--since=".length);
    else if (raw === "--out") args.out = argv[++i];
    else if (raw.startsWith("--out=")) args.out = raw.slice("--out=".length);
    else if (raw === "--mark-missing-parent-summary") {
      args.markMissingParentSummary = true;
    } else if (raw === "--classification") {
      args.classification = argv[++i] as Classification;
    } else if (raw.startsWith("--classification=")) {
      args.classification = raw.slice("--classification=".length) as Classification;
    } else if (raw === "--runs-json") {
      args.runsJson = argv[++i];
    } else if (raw.startsWith("--runs-json=")) {
      args.runsJson = raw.slice("--runs-json=".length);
    } else if (raw === "--parent-summary") {
      args.parentSummary = argv[++i];
    } else if (raw.startsWith("--parent-summary=")) {
      args.parentSummary = raw.slice("--parent-summary=".length);
    } else if (raw === "--production-code-target") {
      args.productionCodeTarget?.push(argv[++i]);
    } else if (raw.startsWith("--production-code-target=")) {
      args.productionCodeTarget?.push(raw.slice("--production-code-target=".length));
    } else if (raw === "--escalation-contact") {
      args.escalationContact = argv[++i];
    } else if (raw.startsWith("--escalation-contact=")) {
      args.escalationContact = raw.slice("--escalation-contact=".length);
    }
  }
  return args;
}

function addHours(iso: string, hours: number): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) throw new Error(`invalid --since=${iso}`);
  return new Date(t + hours * 3600 * 1000).toISOString();
}

function normalizeRunsJson(path: string | undefined): HourlyRunEntry[] {
  if (!path || !existsSync(path)) return [];
  const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
  const rows = Array.isArray(parsed)
    ? parsed
    : (parsed as { workflow_runs?: unknown[] }).workflow_runs ?? [];
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      hour: String(r.created_at ?? r.createdAt ?? r.hour ?? ""),
      runUrl: String(r.html_url ?? r.htmlUrl ?? r.runUrl ?? "-"),
      conclusion: String(r.conclusion ?? "unknown"),
    };
  }).filter((r) => r.hour);
}

export function detectMissingHours(
  since: string,
  runs: HourlyRunEntry[],
  expectedHours = 168,
): HourlyRunEntry[] {
  const successHours = new Set(
    runs
      .filter((r) => r.conclusion === "success")
      .map((r) => new Date(r.hour).toISOString().slice(0, 13)),
  );
  const missing: HourlyRunEntry[] = [];
  for (let h = 0; h < expectedHours; h++) {
    const hour = addHours(since, h);
    if (!successHours.has(hour.slice(0, 13))) {
      const failed = runs.find((r) => new Date(r.hour).toISOString().slice(0, 13) === hour.slice(0, 13));
      missing.push({
        hour,
        runUrl: failed?.runUrl ?? "-",
        conclusion: failed?.conclusion ?? "missing",
      });
    }
  }
  return missing;
}

function classifyFromEvidence(
  requested: Classification,
  missing: HourlyRunEntry[],
  parentSummaryMissing: boolean,
): Classification {
  if (requested !== "unknown") return requested;
  if (missing.some((r) => r.conclusion === "failure")) return "production-code";
  if (missing.some((r) => r.conclusion === "missing" || r.conclusion === "cancelled")) {
    return "infrastructure";
  }
  return parentSummaryMissing ? "configuration" : "unknown";
}

export function runCli(argv: string[]): void {
  const args = parseArgs(argv);
  if (!args.since) {
    process.stderr.write("--since=<ISO8601> is required\n");
    process.exit(2);
  }
  const parentSummaryMissing =
    args.markMissingParentSummary ||
    Boolean(args.parentSummary && !existsSync(args.parentSummary));
  const runs = normalizeRunsJson(args.runsJson);
  const missingHours = detectMissingHours(args.since, runs);
  const classification = classifyFromEvidence(
    args.classification,
    missingHours,
    parentSummaryMissing,
  );
  const md = renderRootcauseMarkdown({
    since: args.since,
    parentSummaryMissing,
    classification,
    missingHours,
    productionCodeTargets: args.productionCodeTarget,
    escalationContact: args.escalationContact,
  });
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, md);
}

const invokedAsCli =
  process.argv[1]?.endsWith("recovery-rootcause-helper.ts") ||
  process.argv[1]?.endsWith("recovery-rootcause-helper.js");
if (invokedAsCli) {
  try {
    runCli(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    process.exit(1);
  }
}
