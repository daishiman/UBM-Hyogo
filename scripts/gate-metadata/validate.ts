import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { GatesArraySchema } from "../../packages/shared/src/gate-metadata/index";

export interface Counts {
  ok: number;
  warn: number;
  error: number;
}

export interface Finding {
  file: string;
  level: "OK" | "WARN" | "ERROR";
  message: string;
}

export interface ValidateOptions {
  cwd?: string;
  searchRoot?: string;
  requireGatesForChanged?: string[];
}

const DEFAULT_SEARCH_ROOT = "docs/30-workflows";

export async function findArtifacts(opts: ValidateOptions = {}): Promise<string[]> {
  const cwd = opts.cwd ?? process.cwd();
  const root = path.resolve(cwd, opts.searchRoot ?? DEFAULT_SEARCH_ROOT);
  const out: string[] = [];
  await walk(root, out);
  return out.sort();
}

async function walk(dir: string, out: string[]): Promise<void> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
      await walk(full, out);
    } else if (ent.isFile() && ent.name === "artifacts.json") {
      out.push(full);
    }
  }
}

export async function readJson(file: string): Promise<unknown> {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

export function pickGates(json: unknown): unknown {
  if (json && typeof json === "object" && "metadata" in (json as Record<string, unknown>)) {
    const meta = (json as { metadata?: unknown }).metadata;
    if (meta && typeof meta === "object" && "gates" in (meta as Record<string, unknown>)) {
      return (meta as { gates?: unknown }).gates;
    }
  }
  return undefined;
}

export function isPathSafe(rel: string, repoRoot: string): boolean {
  if (path.isAbsolute(rel)) return false;
  const abs = path.resolve(repoRoot, rel);
  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : repoRoot + path.sep;
  return abs === repoRoot || abs.startsWith(rootWithSep);
}

export async function validateFile(
  file: string,
  opts: { repoRoot: string; requireGates?: boolean },
): Promise<Finding[]> {
  const findings: Finding[] = [];
  let json: unknown;
  try {
    json = await readJson(file);
  } catch (e) {
    findings.push({ file, level: "ERROR", message: `JSON parse failed: ${(e as Error).message}` });
    return findings;
  }

  const gates = pickGates(json);
  if (gates === undefined) {
    findings.push({
      file,
      level: opts.requireGates ? "ERROR" : "WARN",
      message: opts.requireGates
        ? "metadata.gates absent on changed artifacts.json"
        : "metadata.gates absent — skipped",
    });
    return findings;
  }
  if (!Array.isArray(gates)) {
    findings.push({ file, level: "ERROR", message: "metadata.gates is not an array" });
    return findings;
  }

  const parsed = GatesArraySchema.safeParse(gates);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      findings.push({
        file,
        level: "ERROR",
        message: `schema: ${issue.path.join(".")} — ${issue.message}`,
      });
    }
    return findings;
  }

  for (const entry of parsed.data) {
    if (!isPathSafe(entry.evidence_path, opts.repoRoot)) {
      findings.push({
        file,
        level: "ERROR",
        message: `${entry.gate_id}: evidence_path escapes repo root (${entry.evidence_path})`,
      });
      continue;
    }
    if (entry.status !== "passed") continue;
    const abs = path.resolve(opts.repoRoot, entry.evidence_path);
    try {
      await fs.access(abs);
      findings.push({
        file,
        level: "OK",
        message: `${entry.gate_id}: passed (evidence ${entry.evidence_path})`,
      });
    } catch {
      findings.push({
        file,
        level: "ERROR",
        message: `${entry.gate_id}: evidence_path not found (${entry.evidence_path})`,
      });
    }
  }
  return findings;
}

export async function main(opts: ValidateOptions = {}): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const repoRoot = path.resolve(cwd);
  const required = new Set(
    (opts.requireGatesForChanged ?? []).map((f) => path.resolve(repoRoot, f)),
  );
  const files = await findArtifacts({ ...opts, cwd });
  const findings: Finding[] = [];
  for (const f of files) {
    findings.push(...(await validateFile(f, { repoRoot, requireGates: required.has(path.resolve(f)) })));
  }
  const counts: Counts = { ok: 0, warn: 0, error: 0 };
  for (const f of findings) {
    counts[f.level.toLowerCase() as keyof Counts]++;
  }
  for (const f of findings) {
    const rel = path.relative(repoRoot, f.file);
    console.log(`[${f.level}] ${rel}: ${f.message}`);
  }
  console.log("");
  console.log(`OK: ${counts.ok} WARN: ${counts.warn} ERROR: ${counts.error}`);
  return counts.error > 0 ? 1 : 0;
}

const isEntry = (() => {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === new URL(`file://${process.argv[1]}`).href ||
      fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
  } catch {
    return false;
  }
})();

if (isEntry) {
  const changedFlag = "--require-gates-for-changed";
  const idx = process.argv.indexOf(changedFlag);
  const changed = idx === -1 ? [] : process.argv.slice(idx + 1);
  main({ requireGatesForChanged: changed }).then((code) => process.exit(code));
}
