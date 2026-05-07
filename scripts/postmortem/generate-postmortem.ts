#!/usr/bin/env tsx

import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

export type PostmortemInput = {
  release: string;
  commit: string;
  evidencePath: string;
  rollbackEvidencePath: string;
  occurredAt: string;
  detectedAt?: string;
  resolvedAt?: string;
  severity?: string;
};

export type ValidationResult =
  | { ok: true; input: PostmortemInput }
  | { ok: false; reason: string };

const RELEASE_RE = /^v\d+\.\d+\.\d+$/;
const COMMIT_RE = /^[0-9a-f]{7,40}$/;
const ISO8601_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const TEMPLATE_PATH = "docs/30-workflows/runbooks/postmortem/template.md";
const PLACEHOLDERS: ReadonlyArray<keyof PostmortemInput> = [
  "release",
  "commit",
  "evidencePath",
  "rollbackEvidencePath",
  "occurredAt",
  "detectedAt",
  "resolvedAt",
  "severity",
];

function required(raw: Record<string, string | undefined>, key: string): string | undefined {
  const value = raw[key];
  return value && value.trim() ? value.trim() : undefined;
}

export function validateInput(raw: Record<string, string | undefined>): ValidationResult {
  const release = required(raw, "release");
  if (!release) return { ok: false, reason: "missing required field: release" };
  if (!RELEASE_RE.test(release)) return { ok: false, reason: `invalid release: ${release}` };

  const commit = required(raw, "commit");
  if (!commit) return { ok: false, reason: "missing required field: commit" };
  if (!COMMIT_RE.test(commit)) return { ok: false, reason: `invalid commit: ${commit}` };

  const evidencePath = required(raw, "evidencePath") ?? required(raw, "evidence");
  if (!evidencePath) return { ok: false, reason: "missing required field: evidence" };

  const rollbackEvidencePath =
    required(raw, "rollbackEvidencePath") ?? required(raw, "rollback-evidence");
  if (!rollbackEvidencePath) {
    return { ok: false, reason: "missing required field: rollback-evidence" };
  }

  const occurredAt = required(raw, "occurredAt") ?? required(raw, "occurred-at");
  if (!occurredAt) return { ok: false, reason: "missing required field: occurred-at" };
  if (!ISO8601_RE.test(occurredAt)) {
    return { ok: false, reason: `invalid occurred-at: ${occurredAt}` };
  }

  const detectedAt = required(raw, "detectedAt") ?? required(raw, "detected-at");
  if (detectedAt && !ISO8601_RE.test(detectedAt)) {
    return { ok: false, reason: `invalid detected-at: ${detectedAt}` };
  }

  const resolvedAt = required(raw, "resolvedAt") ?? required(raw, "resolved-at");
  if (resolvedAt && !ISO8601_RE.test(resolvedAt)) {
    return { ok: false, reason: `invalid resolved-at: ${resolvedAt}` };
  }

  const severity = required(raw, "severity");
  return {
    ok: true,
    input: {
      release,
      commit,
      evidencePath,
      rollbackEvidencePath,
      occurredAt,
      ...(detectedAt ? { detectedAt } : {}),
      ...(resolvedAt ? { resolvedAt } : {}),
      ...(severity ? { severity } : {}),
    },
  };
}

export function ensureEvidencePathExists(path: string): { ok: boolean; reason?: string } {
  try {
    const stats = statSync(path);
    if (!stats.isDirectory()) {
      return { ok: false, reason: `evidence path is not a directory: ${path}` };
    }
    const main = resolve(path, "main.md");
    if (!existsSync(main)) {
      return { ok: false, reason: `evidence main.md not found: ${main}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: `evidence path not found: ${path}` };
  }
}

export function validateRollbackEvidencePath(path: string): {
  ok: boolean;
  reason?: string;
  warning?: string;
} {
  try {
    const stats = statSync(path);
    if (!stats.isFile()) {
      return { ok: false, reason: `rollback evidence is not a file: ${path}` };
    }
    if (stats.size === 0) {
      return { ok: true, warning: `warning: rollback-evidence is empty: ${path}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: `rollback evidence not found: ${path}` };
  }
}

export function renderTemplate(template: string, input: PostmortemInput): string {
  return PLACEHOLDERS.reduce((acc, key) => {
    const value = input[key] ?? "";
    return acc.replaceAll(`{{${key}}}`, value);
  }, template);
}

export function generatePostmortem(input: PostmortemInput, template: string): string {
  return renderTemplate(template, input);
}

export function loadTemplate(): string {
  const template = readFileSync(TEMPLATE_PATH, "utf8");
  return template;
}

function parseCliArgs(argv: string[]): Record<string, string | undefined> {
  const parsed = parseArgs({
    args: argv,
    options: {
      release: { type: "string" },
      commit: { type: "string" },
      evidence: { type: "string" },
      "rollback-evidence": { type: "string" },
      "occurred-at": { type: "string" },
      "detected-at": { type: "string" },
      "resolved-at": { type: "string" },
      severity: { type: "string" },
      out: { type: "string" },
      help: { type: "boolean" },
    },
    allowPositionals: false,
  });
  const values = parsed.values;
  if (values.help) {
    return { help: "true" };
  }
  return {
    release: values.release,
    commit: values.commit,
    evidence: values.evidence,
    "rollback-evidence": values["rollback-evidence"],
    "occurred-at": values["occurred-at"],
    "detected-at": values["detected-at"],
    "resolved-at": values["resolved-at"],
    severity: values.severity,
    out: values.out,
  };
}

function usage(): string {
  return [
    "usage: pnpm postmortem:generate -- --release vX.Y.Z --commit <sha>",
    "  --evidence <09c-phase-11-dir> --rollback-evidence <rollback-md>",
    "  --occurred-at <iso8601> [--detected-at <iso8601>] [--resolved-at <iso8601>]",
    "  [--severity <label>] [--out <path>]",
    "",
  ].join("\n");
}

export async function main(argv: string[]): Promise<number> {
  let raw: Record<string, string | undefined>;
  try {
    raw = parseCliArgs(argv[0] === "--" ? argv.slice(1) : argv);
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n`);
    return 1;
  }

  if (raw.help === "true") {
    process.stdout.write(usage());
    return 0;
  }

  const validation = validateInput(raw);
  if (!validation.ok) {
    process.stderr.write(`${validation.reason}\n`);
    return 1;
  }

  const evidence = ensureEvidencePathExists(validation.input.evidencePath);
  if (!evidence.ok) {
    process.stderr.write(`${evidence.reason ?? "invalid evidence path"}\n`);
    return 1;
  }

  const rollbackEvidence = validateRollbackEvidencePath(validation.input.rollbackEvidencePath);
  if (!rollbackEvidence.ok) {
    process.stderr.write(`${rollbackEvidence.reason ?? "invalid rollback evidence"}\n`);
    return 1;
  }
  if (rollbackEvidence.warning) {
    process.stderr.write(`${rollbackEvidence.warning}\n`);
  }

  const markdown = generatePostmortem(validation.input, loadTemplate());
  const out = required(raw, "out");
  if (!out) {
    process.stdout.write(markdown);
    return 0;
  }

  try {
    writeFileSync(out, markdown, "utf8");
    return 0;
  } catch (error) {
    process.stderr.write(`failed to write: ${out} (${(error as Error).message})\n`);
    return 2;
  }
}

const entry = process.argv[1] ?? "";
if (entry.endsWith("generate-postmortem.ts") || entry.endsWith("generate-postmortem.js")) {
  void main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
