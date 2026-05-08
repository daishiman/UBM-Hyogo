#!/usr/bin/env tsx
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import type { HourlySnapshot } from "./post-switch-monitor.ts";

export interface AlertEvaluation {
  triggered: boolean;
  windowHours: number;
  threshold: number;
  observed: Array<Pick<HourlySnapshot, "hour" | "fallbackRate">>;
  reason: string;
}

export function evaluateConsecutive(
  snapshots: HourlySnapshot[],
  threshold: number,
  window: number,
): AlertEvaluation {
  if (snapshots.length === 0) {
    return {
      triggered: false,
      windowHours: window,
      threshold,
      observed: [],
      reason: "no snapshots",
    };
  }
  const sorted = [...snapshots].sort((a, b) => a.hour.localeCompare(b.hour));
  const window_ = sorted.slice(-window);
  const observed = window_.map((s) => ({ hour: s.hour, fallbackRate: s.fallbackRate }));
  if (window_.length < window) {
    return {
      triggered: false,
      windowHours: window,
      threshold,
      observed,
      reason: `not enough snapshots (have ${window_.length}, need ${window})`,
    };
  }
  const allOver = window_.every((s) => s.fallbackRate > threshold);
  return {
    triggered: allOver,
    windowHours: window,
    threshold,
    observed,
    reason: allOver
      ? `fallbackRate > ${threshold} for ${window} consecutive hours`
      : "at least one snapshot within threshold",
  };
}

export function buildIssueBody(evaluation: AlertEvaluation): string {
  const lines = [
    "## CF Audit Log Monitor — Fallback Rate Alert",
    "",
    `- window hours: ${evaluation.windowHours}`,
    `- threshold: ${evaluation.threshold}`,
    "",
    "### Observed snapshots",
    "",
    "| hour | fallbackRate |",
    "| --- | --- |",
    ...evaluation.observed.map(
      (o) => `| ${o.hour} | ${(o.fallbackRate * 100).toFixed(2)}% |`,
    ),
    "",
    "Refs #549",
  ];
  return lines.join("\n");
}

interface CliArgs {
  window: number;
  threshold: number;
  snapshotsDir: string;
  dryRun: boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    window: 3,
    threshold: 0.05,
    snapshotsDir: "outputs/observation",
    dryRun: false,
  };
  for (const raw of argv) {
    if (raw.startsWith("--window=")) {
      args.window = Number.parseInt(raw.slice("--window=".length), 10);
    } else if (raw.startsWith("--threshold=")) {
      args.threshold = Number.parseFloat(raw.slice("--threshold=".length));
    } else if (raw.startsWith("--input=")) {
      args.snapshotsDir = raw.slice("--input=".length);
    } else if (raw === "--dry-run") {
      args.dryRun = true;
    }
  }
  if (!Number.isFinite(args.window) || args.window <= 0) {
    throw new Error("--window must be positive integer");
  }
  if (!Number.isFinite(args.threshold) || args.threshold <= 0 || args.threshold >= 1) {
    throw new Error("--threshold must be 0 < t < 1");
  }
  return args;
}

export function readSnapshots(dir: string): HourlySnapshot[] {
  const entries = readdirSync(dir).filter((f) => f.endsWith(".json"));
  return entries.map(
    (f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as HourlySnapshot,
  );
}

export interface IssueCreator {
  (params: {
    repo: string;
    title: string;
    body: string;
    labels: string[];
    token: string;
  }): Promise<string>;
}

const defaultIssueCreator: IssueCreator = async ({ repo, title, body, labels, token }) => {
  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
    },
    body: JSON.stringify({ title, body, labels }),
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }
  const json = (await response.json()) as { html_url: string };
  return json.html_url;
};

export async function evaluateAndAlert(opts: {
  snapshots: HourlySnapshot[];
  window: number;
  threshold: number;
  dryRun: boolean;
  repo?: string;
  token?: string;
  createIssue?: IssueCreator;
}): Promise<{ evaluation: AlertEvaluation; issueUrl?: string }> {
  const evaluation = evaluateConsecutive(opts.snapshots, opts.threshold, opts.window);
  if (!evaluation.triggered || opts.dryRun) {
    return { evaluation };
  }
  if (!opts.repo || !opts.token) {
    throw new Error("repo and token are required to create issue");
  }
  const creator = opts.createIssue ?? defaultIssueCreator;
  const issueUrl = await creator({
    repo: opts.repo,
    title: `[cf-audit] fallback rate > ${opts.threshold} for ${opts.window}h`,
    body: buildIssueBody(evaluation),
    labels: ["type:incident", "priority:high", "cf-audit"],
    token: opts.token,
  });
  return { evaluation, issueUrl };
}

export async function runCli(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const snapshots = readSnapshots(args.snapshotsDir);
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  const result = await evaluateAndAlert({
    snapshots,
    window: args.window,
    threshold: args.threshold,
    dryRun: args.dryRun || !token || !repo,
    repo,
    token,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const invokedAsCli =
  process.argv[1]?.endsWith("fallback-rate-alert.ts") ||
  process.argv[1]?.endsWith("fallback-rate-alert.js");
if (invokedAsCli) {
  runCli(process.argv.slice(2)).catch((err: Error) => {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  });
}
