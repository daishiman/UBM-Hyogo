#!/usr/bin/env tsx
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import process from "node:process";
import { parseArgs } from "./cli-args.ts";
import { InMemoryD1, readEventsForFeatureExport, WranglerD1, type D1Like } from "./d1-client.ts";
import { scanForSecrets } from "./evaluation/secret-leakage-grep.ts";
import { extractFeatures } from "./features/extract.ts";
import { buildFeatureExportManifest } from "./feature-export/manifest.ts";
import { validateRedactedFeatureJsonl } from "./feature-export/schema-validation.ts";
import { guardJsonlOrThrow } from "./redaction-guard.ts";
import type {
  AuditLogEvent,
  FeatureExportLine,
  FeatureExportManifest,
  FeatureExportWindow,
} from "./types.ts";

export async function exportRedactedFeatureDataset(input: {
  db: D1Like;
  window: FeatureExportWindow;
  redactSecret: string;
  outPath: string;
  manifestPath: string;
  now?: () => Date;
  exportRunId?: string;
}): Promise<FeatureExportManifest> {
  if (!input.redactSecret || input.redactSecret.length < 8) {
    throw new Error("redaction secret is required");
  }
  const events = await readEventsForFeatureExport(input.db, input.window);
  const lines: FeatureExportLine[] = events.map((event) => ({
    id: event.id,
    occurredAt: event.when,
    features: extractFeatures(event, { redactSecret: input.redactSecret }),
  }));
  const jsonl = lines.map((line) => JSON.stringify(line)).join("\n") +
    (lines.length > 0 ? "\n" : "");

  validateRedactedFeatureJsonl(jsonl);
  guardJsonlOrThrow(jsonl);

  const tmpOutPath = `${input.outPath}.tmp`;
  const tmpManifestPath = `${input.manifestPath}.tmp`;
  cleanupTemp(tmpOutPath, tmpManifestPath);
  try {
    writeFileSync(tmpOutPath, jsonl);

    const leakage = scanForSecrets(tmpOutPath);
    if (leakage.hits.length > 0) {
      throw new Error(`feature export leakage scan failed: ${JSON.stringify(leakage.hits)}`);
    }

    const manifest = buildFeatureExportManifest({
      window: input.window,
      rowCount: lines.length,
      jsonl,
      now: input.now,
      exportRunId: input.exportRunId,
    });
    writeFileSync(tmpManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    renameSync(tmpOutPath, input.outPath);
    renameSync(tmpManifestPath, input.manifestPath);
    return manifest;
  } catch (error) {
    cleanupTemp(tmpOutPath, tmpManifestPath);
    throw error;
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const outPath = stringArg(args, "out");
  const manifestPath = stringArg(args, "manifest-out");
  const window = parseWindow(args);
  const redactSecret = readRedactionSecret(args);
  const db = loadDb(args);

  if (args["dry-run"] === true) {
    process.stderr.write("[feature-export] dry-run: validates export pipeline; production still requires --confirm-production-export\n");
  }
  const manifest = await exportRedactedFeatureDataset({
    db,
    window,
    redactSecret,
    outPath,
    manifestPath,
  });
  process.stdout.write(JSON.stringify({ ok: true, manifest }) + "\n");
}

export function loadDb(args: Record<string, string | boolean>): D1Like {
  const fixturePath = typeof args.fixture === "string" ? args.fixture : null;
  if (fixturePath) {
    const parsed = JSON.parse(readFileSync(fixturePath, "utf8")) as
      | AuditLogEvent[]
      | { events: AuditLogEvent[] };
    const events = Array.isArray(parsed) ? parsed : parsed.events;
    return InMemoryD1.fromEvents(events);
  }
  const env = args.env === "staging" ? "staging" : "production";
  if (env === "production" && args["confirm-production-export"] !== true) {
    throw new Error("production feature export requires --confirm-production-export after user approval");
  }
  const database = typeof args.database === "string"
    ? args.database
    : process.env.CF_AUDIT_DB ?? "ubm-hyogo-db-prod";
  return new WranglerD1(database, env);
}

function parseWindow(args: Record<string, string | boolean>): FeatureExportWindow {
  const hasFrom = typeof args.from === "string";
  const hasTo = typeof args.to === "string";
  const hasDays = typeof args.days === "string";
  if (hasDays && (hasFrom || hasTo)) {
    throw new Error("use either --days or --from/--to, not both");
  }
  if (hasFrom !== hasTo) {
    throw new Error("--from and --to must be provided together");
  }

  const toUtc = hasTo ? parseDate(args.to as string, "to") : new Date();
  let fromUtc: Date;
  if (hasFrom) {
    fromUtc = parseDate(args.from as string, "from");
  } else {
    const days = hasDays ? Number(args.days) : 90;
    if (!Number.isInteger(days) || days <= 0) {
      throw new Error("--days must be a positive integer");
    }
    fromUtc = new Date(toUtc.getTime() - days * 86_400_000);
  }
  if (fromUtc.getTime() >= toUtc.getTime()) {
    throw new Error("--from must be before --to");
  }
  return { fromUtc, toUtc };
}

function parseDate(value: string, name: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`--${name} must be an ISO timestamp`);
  }
  return date;
}

function readRedactionSecret(args: Record<string, string | boolean>): string {
  const envName = typeof args["redact-secret-env"] === "string"
    ? args["redact-secret-env"]
    : "CF_AUDIT_REDACT_SECRET";
  const value = process.env[envName];
  if (!value) {
    throw new Error(`missing redaction secret env: ${envName}`);
  }
  return value;
}

function stringArg(args: Record<string, string | boolean>, name: string): string {
  const value = args[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`--${name} is required`);
  }
  return value;
}

function cleanupTemp(...paths: string[]): void {
  for (const path of paths) {
    if (existsSync(path)) {
      rmSync(path, { force: true });
    }
  }
}

if (process.argv[1]?.endsWith("feature-export.ts")) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exit(1);
  });
}
