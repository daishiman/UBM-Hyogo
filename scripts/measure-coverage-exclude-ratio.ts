#!/usr/bin/env tsx
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, relative } from "node:path";
import { parseArgs } from "node:util";

export interface ExcludeRatioResult {
  measured_at: string;
  vitest_config_path: string;
  target_root: string;
  target_extensions: string[];
  total_files: number;
  excluded_files: string[];
  excluded_count: number;
  ratio: number;
  threshold: number;
  status: "ok" | "warn";
}

interface MeasureOptions {
  vitestConfigPath: string;
  targetRoot: string;
  targetExtensions?: string[];
  threshold?: number;
}

function isTestLikeFile(file: string): boolean {
  return /\.(spec|test)\.(ts|tsx)$/.test(file);
}

export function extractCoverageExcludePatterns(vitestConfigText: string): string[] {
  const coverageIndex = vitestConfigText.indexOf("coverage:");
  if (coverageIndex < 0) return [];

  const excludeIndex = vitestConfigText.indexOf("exclude:", coverageIndex);
  if (excludeIndex < 0) return [];

  const open = vitestConfigText.indexOf("[", excludeIndex);
  if (open < 0) return [];

  let depth = 0;
  let close = -1;
  for (let i = open; i < vitestConfigText.length; i += 1) {
    const ch = vitestConfigText[i];
    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }

  if (close < 0) return [];
  return [...vitestConfigText.slice(open + 1, close).matchAll(/["'`]([^"'`]+)["'`]/g)].map((m) => m[1]!);
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "\u0001")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0001/g, "(?:.*/)?")
    .replace(/\u0000/g, ".*");
  return new RegExp(`^${escaped}$`);
}

async function listFiles(root: string, extensions: Set<string>): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = `${root}/${entry.name}`;
      if (entry.isDirectory()) return listFiles(path, extensions);
      if (!entry.isFile()) return [];
      if (!extensions.has(extname(entry.name))) return [];
      return [path];
    }),
  );
  return nested.flat();
}

export async function measureCoverageExcludeRatio(opts: MeasureOptions): Promise<ExcludeRatioResult> {
  const threshold = opts.threshold ?? 0.3;
  const targetExtensions = opts.targetExtensions ?? [".ts", ".tsx"];
  const targetRoot = opts.targetRoot.replace(/\/$/, "");
  const rootStat = await stat(targetRoot);
  if (!rootStat.isDirectory()) {
    throw new Error(`target root is not a directory: ${targetRoot}`);
  }

  const configText = await readFile(opts.vitestConfigPath, "utf8");
  const patterns = extractCoverageExcludePatterns(configText);
  const matchers = patterns.map(globToRegExp);
  const fullFiles = await listFiles(targetRoot, new Set(targetExtensions));
  const eligibleFiles = fullFiles.filter((file) => !isTestLikeFile(file));
  const files = eligibleFiles.map((file) => relative(".", file));
  const excludedFiles = eligibleFiles
    .filter((file, index) => {
      const relativeFile = files[index]!;
      return matchers.some((matcher) => matcher.test(relativeFile) || matcher.test(file));
    })
    .map((file) => relative(".", file));
  const ratio = files.length === 0 ? 0 : excludedFiles.length / files.length;

  return {
    measured_at: new Date().toISOString(),
    vitest_config_path: opts.vitestConfigPath,
    target_root: targetRoot,
    target_extensions: targetExtensions,
    total_files: files.length,
    excluded_files: excludedFiles.sort(),
    excluded_count: excludedFiles.length,
    ratio,
    threshold,
    status: ratio >= threshold ? "warn" : "ok",
  };
}

export function toMarkdown(result: ExcludeRatioResult): string {
  const pct = (result.ratio * 100).toFixed(1);
  const thresholdPct = (result.threshold * 100).toFixed(0);
  return [
    "# Coverage Exclude Ratio",
    "",
    `- measured_at: ${result.measured_at}`,
    `- vitest_config_path: \`${result.vitest_config_path}\``,
    `- target_root: \`${result.target_root}\``,
    `- total_files: ${result.total_files}`,
    `- excluded_count: ${result.excluded_count}`,
    `- ratio: ${pct}%`,
    `- threshold: ${thresholdPct}%`,
    `- status: ${result.status}`,
    "",
    "## Excluded Files",
    "",
    ...(result.excluded_files.length > 0 ? result.excluded_files.map((file) => `- \`${file}\``) : ["- None"]),
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "vitest-config": { type: "string", default: "vitest.config.ts" },
      "target-root": { type: "string", default: "apps/web/app" },
      threshold: { type: "string", default: "0.30" },
      out: { type: "string" },
    },
  });

  const result = await measureCoverageExcludeRatio({
    vitestConfigPath: values["vitest-config"]!,
    targetRoot: values["target-root"]!,
    threshold: Number(values.threshold),
  });

  if (values.out) {
    await mkdir(dirname(values.out), { recursive: true });
    const body = extname(values.out) === ".md" ? toMarkdown(result) : JSON.stringify(result, null, 2);
    await writeFile(values.out, `${body}\n`, "utf8");
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]?.endsWith("measure-coverage-exclude-ratio.ts")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
