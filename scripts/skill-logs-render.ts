#!/usr/bin/env tsx
// pnpm skill:logs:render — render skill ledger fragments in timestamp-desc order.

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

import {
  FRAGMENT_NAME_REGEX,
  dirForType,
  type FragmentType,
} from "./lib/fragment-path.js";
import {
  FrontMatterError,
  parseFragment,
  type FrontMatter,
} from "./lib/front-matter.js";

export interface RenderSkillLogsOptions {
  skill: string;
  since?: string;
  out?: string;
  includeLegacy?: boolean;
  rootDir?: string;
  now?: Date;
}

export interface RenderSkillLogsResult {
  output: string;
  fragmentCount: number;
  legacyIncluded: number;
  errors: string[];
}

const FRAGMENT_TYPES: ReadonlyArray<FragmentType> = [
  "log",
  "changelog",
  "lessons-learned",
];

const LEGACY_INCLUDE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const TRACKED_CANONICAL_BASENAMES = new Set<string>([
  "LOGS.md",
  "SKILL-changelog.md",
]);

interface FragmentEntry {
  absPath: string;
  relPath: string;
  type: FragmentType;
  fm: FrontMatter;
  body: string;
}

interface LegacyEntry {
  absPath: string;
  type: FragmentType;
  basename: string;
  pseudoTimestampMs: number;
  content: string;
}

function isTrackedCanonical(outPath: string): boolean {
  const base = outPath.split(/[\\/]/).pop() ?? "";
  if (TRACKED_CANONICAL_BASENAMES.has(base)) return true;
  return /lessons-learned-[^/]*\.md$/.test(outPath) && !/_legacy/.test(outPath);
}

function listFragmentFiles(dirPath: string, type: FragmentType): string[] {
  if (!existsSync(dirPath)) return [];
  const entries = readdirSync(dirPath);
  const dirName = dirForType(type);
  const out: string[] = [];
  for (const name of entries) {
    if (name === ".gitkeep") continue;
    if (name.startsWith("_legacy")) continue;
    const rel = `${dirName}/${name}`;
    if (FRAGMENT_NAME_REGEX.test(rel)) out.push(name);
  }
  return out;
}

function listLegacyFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath).filter((n) => n.startsWith("_legacy"));
}

function extractTimestampFromLegacyContent(content: string): string | null {
  const isoMatch = content.match(
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/g,
  );
  if (isoMatch && isoMatch.length > 0) {
    return isoMatch[isoMatch.length - 1];
  }
  const dateMatch = content.match(/(\d{4}-\d{2}-\d{2})/g);
  if (dateMatch && dateMatch.length > 0) {
    return `${dateMatch[dateMatch.length - 1]}T00:00:00Z`;
  }
  return null;
}

export function extractTimestampFromLegacy(
  absPath: string,
  content: string,
): number {
  const fromBody = extractTimestampFromLegacyContent(content);
  if (fromBody) {
    const t = Date.parse(fromBody);
    if (!Number.isNaN(t)) return t;
  }
  try {
    return statSync(absPath).mtimeMs;
  } catch {
    return 0;
  }
}

export async function renderSkillLogs(
  options: RenderSkillLogsOptions,
): Promise<RenderSkillLogsResult> {
  const root = options.rootDir ?? process.cwd();
  const skillDir = resolve(root, ".claude", "skills", options.skill);
  if (!existsSync(skillDir)) {
    throw new Error(`skill directory not found: ${skillDir}`);
  }

  let sinceMs: number | null = null;
  if (options.since) {
    const t = Date.parse(options.since);
    if (Number.isNaN(t)) {
      throw new Error(`invalid --since value (not ISO8601): ${options.since}`);
    }
    sinceMs = t;
  }

  const errors: string[] = [];
  const fragments: FragmentEntry[] = [];

  for (const type of FRAGMENT_TYPES) {
    const dirName = dirForType(type);
    const typeDir = resolve(skillDir, dirName);
    const names = listFragmentFiles(typeDir, type);
    for (const name of names) {
      const abs = resolve(typeDir, name);
      const rel = `${dirName}/${name}`;
      try {
        const content = readFileSync(abs, "utf8");
        const parsed = parseFragment(content, rel);
        fragments.push({
          absPath: abs,
          relPath: rel,
          type,
          fm: parsed.frontMatter,
          body: parsed.body,
        });
      } catch (e) {
        if (e instanceof FrontMatterError) {
          errors.push(e.message);
        } else {
          errors.push(`${rel}: ${(e as Error).message}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { output: "", fragmentCount: 0, legacyIncluded: 0, errors };
  }

  const filtered = fragments.filter((f) => {
    if (sinceMs === null) return true;
    const t = Date.parse(f.fm.timestamp);
    return !Number.isNaN(t) && t >= sinceMs;
  });

  filtered.sort((a, b) => {
    const ta = Date.parse(a.fm.timestamp);
    const tb = Date.parse(b.fm.timestamp);
    return tb - ta;
  });

  const lines: string[] = [];
  lines.push(`# Skill Logs: ${options.skill}`);
  lines.push("");
  lines.push("## Fragments (timestamp 降順)");
  lines.push("");
  for (const f of filtered) {
    lines.push(
      `### ${f.fm.timestamp} — ${f.type} — branch:${f.fm.branch} — author:${f.fm.author}`,
    );
    lines.push(`<!-- ${f.relPath} -->`);
    lines.push("");
    lines.push(f.body.trimEnd());
    lines.push("");
  }

  let legacyIncluded = 0;
  if (options.includeLegacy) {
    const cutoff = (options.now ?? new Date()).getTime() - LEGACY_INCLUDE_WINDOW_MS;
    const legacy: LegacyEntry[] = [];
    for (const type of FRAGMENT_TYPES) {
      const typeDir = resolve(skillDir, dirForType(type));
      for (const name of listLegacyFiles(typeDir)) {
        const abs = resolve(typeDir, name);
        const content = readFileSync(abs, "utf8");
        const ts = extractTimestampFromLegacy(abs, content);
        if (ts >= cutoff) {
          legacy.push({
            absPath: abs,
            type,
            basename: name,
            pseudoTimestampMs: ts,
            content,
          });
        }
      }
    }
    legacy.sort((a, b) => b.pseudoTimestampMs - a.pseudoTimestampMs);
    if (legacy.length > 0) {
      lines.push("## Legacy");
      lines.push("");
      for (const l of legacy) {
        lines.push(`### legacy — ${l.type} — ${l.basename}`);
        lines.push("");
        lines.push(l.content.trimEnd());
        lines.push("");
      }
      legacyIncluded = legacy.length;
    }
  }

  const output = `${lines.join("\n").replace(/\n+$/, "")}\n`;

  if (options.out) {
    if (isTrackedCanonical(options.out)) {
      const err = new Error(
        `--out refuses to overwrite tracked canonical ledger: ${options.out}`,
      );
      (err as Error & { exitCode?: number }).exitCode = 2;
      throw err;
    }
    writeFileSync(options.out, output, "utf8");
  }

  return {
    output,
    fragmentCount: filtered.length,
    legacyIncluded,
    errors: [],
  };
}

interface ParsedArgs {
  skill?: string;
  since?: string;
  out?: string;
  includeLegacy: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { includeLegacy: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--skill" && next) {
      out.skill = next;
      i += 1;
    } else if (a === "--since" && next) {
      out.since = next;
      i += 1;
    } else if (a === "--out" && next) {
      out.out = next;
      i += 1;
    } else if (a === "--include-legacy") {
      out.includeLegacy = true;
    }
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.skill) {
    process.stderr.write(
      "usage: pnpm skill:logs:render --skill <name> [--since <ISO>] [--out <path>] [--include-legacy]\n",
    );
    process.exit(1);
  }
  try {
    const r = await renderSkillLogs({
      skill: args.skill,
      since: args.since,
      out: args.out,
      includeLegacy: args.includeLegacy,
    });
    if (r.errors.length > 0) {
      for (const e of r.errors) process.stderr.write(`${e}\n`);
      process.exit(1);
    }
    if (!args.out) {
      process.stdout.write(r.output);
    }
  } catch (e) {
    const err = e as Error & { exitCode?: number };
    process.stderr.write(`${err.message}\n`);
    process.exit(err.exitCode ?? 1);
  }
}

const entry = process.argv[1] ?? "";
if (entry.endsWith("skill-logs-render.ts") || entry.endsWith("skill-logs-render.js")) {
  void main();
}
