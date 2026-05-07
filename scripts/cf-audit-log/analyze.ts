#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { getClassifier } from "./classifier/index.ts";
import { extractFeatures } from "./features/extract.ts";
import {
  buildFinding,
  reportFinding,
  type IssueClient,
} from "./issue-reporter.ts";
import {
  count403FromActor,
  InMemoryD1,
  isAlreadyReported,
  loadBaseline,
  purgeOlderThan,
  recentEventsInWindow,
  recordClassification,
  recordReported,
  WranglerD1,
  type D1Like,
} from "./d1-client.ts";
import { parseArgs, parseDurationMs } from "./cli-args.ts";
import type { AuditLogEvent, Baseline, Severity } from "./types.ts";

interface AnalyzeFixture {
  events: AuditLogEvent[];
  baseline: Baseline | null;
  githubIpRanges: string[];
  rotationWindowMs: { start: number; end: number } | null;
}

interface LabeledAuditEvent {
  event: AuditLogEvent;
  expectedSeverity: Severity | "NONE";
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = Boolean(args["dry-run"]);
  const fixturePath = typeof args.fixture === "string" ? args.fixture : null;
  const evaluatePath = typeof args.evaluate === "string" ? args.evaluate : null;
  const exportFeaturesPath = typeof args["export-features"] === "string"
    ? args["export-features"]
    : null;
  const windowSpec = typeof args.window === "string" ? args.window : "1h";
  const windowMs = parseDurationMs(windowSpec);

  const ctxBundle = await loadContext(fixturePath, evaluatePath);
  const { db, baseline, githubIpRanges, rotationWindowMs } = ctxBundle;
  const untilMs = Date.now();
  const sinceMs = untilMs - windowMs;
  const events = await recentEventsInWindow(db, sinceMs, untilMs);

  if (exportFeaturesPath) {
    exportRedactedFeatures(events, exportFeaturesPath);
  }

  const client: IssueClient = makeIssueClient(dryRun);
  const owner = process.env.GITHUB_REPOSITORY?.split("/")[0] ?? "daishiman";
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "UBM-Hyogo";
  const classifier = getClassifier({
    CF_AUDIT_CLASSIFIER: typeof args.classifier === "string"
      ? args.classifier
      : process.env.CF_AUDIT_CLASSIFIER,
    ML_MODEL_PATH: typeof args["ml-model-path"] === "string"
      ? args["ml-model-path"]
      : process.env.ML_MODEL_PATH,
  });

  let findings = 0;
  for (const ev of events) {
    const recent = await count403FromActor(
      db,
      ev.actor.email,
      untilMs - 3_600_000,
      untilMs,
    );
    const r = classifier.classify({
      event: ev,
      baseline,
      context: {
        githubIpRanges,
        businessHoursJst: { start: 9, end: 19 },
        recentFailuresInHour: recent,
        rotationWindowMs,
        failureSpikeMultiplier: 1.5,
      },
    });
    if (!r) continue;
    await recordClassification(db, ev.id, {
      severity: r.severity,
      classifierUsed: r.classifierUsed,
      classifierVersion: r.classifierVersion,
      confidence: r.confidence,
    });
    const finding = buildFinding(ev, r);
    await reportFinding(finding, {
      client,
      owner,
      repo,
      isAlreadyReported: (k) => isAlreadyReported(db, k),
      recordReported: (k, n) => recordReported(db, k, n),
      dryRun,
    });
    findings++;
  }

  await purgeOlderThan(db, untilMs - 30 * 86_400_000);
  process.stdout.write(JSON.stringify({ ok: true, findings }) + "\n");
}

async function loadContext(fixturePath: string | null, evaluatePath: string | null): Promise<{
  db: D1Like;
  baseline: Baseline | null;
  githubIpRanges: string[];
  rotationWindowMs: { start: number; end: number } | null;
}> {
  if (fixturePath) {
    const fx = JSON.parse(readFileSync(fixturePath, "utf8")) as AnalyzeFixture;
    return {
      db: InMemoryD1.fromEvents(fx.events),
      baseline: fx.baseline,
      githubIpRanges: fx.githubIpRanges,
      rotationWindowMs: fx.rotationWindowMs,
    };
  }
  if (evaluatePath) {
    const rows = readFileSync(evaluatePath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as LabeledAuditEvent);
    return {
      db: InMemoryD1.fromEvents(rows.map((row) => row.event)),
      baseline: null,
      githubIpRanges: ["140.82.112.0/20", "192.30.252.0/22"],
      rotationWindowMs: null,
    };
  }
  const db = new WranglerD1(
    process.env.CF_AUDIT_DB ?? "ubm-hyogo-db-prod",
    "production",
  );
  const baseline = await loadBaseline(db);
  const githubIpRanges = await loadGithubIpRanges();
  return {
    db,
    baseline,
    githubIpRanges,
    rotationWindowMs: parseRotationWindow(process.env.CF_AUDIT_ROTATION_WINDOW),
  };
}

function exportRedactedFeatures(events: AuditLogEvent[], outPath: string): void {
  const redactSecret = process.env.CF_AUDIT_REDACT_SECRET ?? "local-redaction-secret";
  const lines = events.map((event) =>
    JSON.stringify({ id: event.id, features: extractFeatures(event, { redactSecret }) })
  );
  writeFileSync(outPath, `${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`);
}

async function loadGithubIpRanges(): Promise<string[]> {
  if (process.env.CF_AUDIT_GITHUB_CIDR) {
    return process.env.CF_AUDIT_GITHUB_CIDR.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const res = await fetch("https://api.github.com/meta");
  if (!res.ok) throw new Error(`api.github.com/meta ${res.status}`);
  const json = (await res.json()) as { actions?: string[]; web?: string[] };
  return [...(json.actions ?? []), ...(json.web ?? [])];
}

function parseRotationWindow(spec: string | undefined): { start: number; end: number } | null {
  if (!spec) return null;
  const [a, b] = spec.split(",").map((s) => s.trim());
  if (!a || !b) return null;
  const start = Date.parse(a);
  const end = Date.parse(b);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return { start, end };
}

function makeIssueClient(dryRun: boolean): IssueClient {
  return {
    async create(input) {
      if (dryRun) return { number: -1 };
      const token = process.env.GITHUB_TOKEN;
      if (!token) throw new Error("GITHUB_TOKEN required for non-dry-run");
      const res = await fetch(
        `https://api.github.com/repos/${input.owner}/${input.repo}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: input.title,
            body: input.body,
            labels: input.labels,
          }),
        },
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`gh issue create ${res.status} ${t}`);
      }
      const json = (await res.json()) as { number: number };
      return { number: json.number };
    },
  };
}

main().catch((e: unknown) => {
  process.stderr.write(
    `${e instanceof Error ? e.stack ?? e.message : String(e)}\n`,
  );
  process.exit(1);
});
