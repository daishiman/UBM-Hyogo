#!/usr/bin/env tsx
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type ThresholdSourceKind = "ssot" | "executor" | "codecov";

export type ThresholdSource = {
  kind: ThresholdSourceKind;
  path: string;
  threshold: number;
};

export type LintResult =
  | { ok: true; threshold: number; sources: ThresholdSource[] }
  | { ok: false; errorKind: "drift"; threshold: number; sources: ThresholdSource[]; mismatches: ThresholdSource[] }
  | { ok: false; errorKind: "parse"; message: string; sources: ThresholdSource[] };

type Options = {
  rootDir: string;
  ssotPath: string;
  executorPath: string;
  codecovPath: string;
  includeCodeCov: boolean;
};

const DEFAULT_SSOT = ".claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md";
const DEFAULT_EXECUTOR = "scripts/coverage-guard.sh";
const DEFAULT_CODECOV = "codecov.yml";

function readRequired(path: string, label: string): string {
  if (!existsSync(path)) {
    throw new Error(`${label} not found: ${path}`);
  }
  return readFileSync(path, "utf8");
}

function unique(values: number[]): number[] {
  return [...new Set(values)];
}

function parsePercentValues(row: string): number[] {
  const matches = row.matchAll(/(?:^|[\s|])(\d+(?:\.\d+)?)%/g);
  return [...matches].map((match) => Number(match[1]));
}

export function parseSsotThreshold(source: string): number {
  const marker = "### カバレッジ閾値設定";
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`SSOT coverage threshold section not found: ${marker}`);
  }

  const section = source.slice(start).split(/\n###\s+/)[0] ?? "";
  const packageRows = section
    .split(/\r?\n/)
    .filter((line) => /^\|\s*(apps|packages)\//.test(line));
  if (packageRows.length === 0) {
    throw new Error("SSOT package threshold table rows not found");
  }

  const values = unique(packageRows.flatMap(parsePercentValues));
  if (values.length !== 1) {
    throw new Error(`SSOT threshold must be a single value; found ${values.join(", ") || "none"}`);
  }
  return values[0];
}

export function parseExecutorThreshold(source: string): number {
  const match = source.match(/^\s*THRESHOLD=(\d+(?:\.\d+)?)(?:\s*(?:#.*)?)$/m);
  if (!match) {
    throw new Error("executor THRESHOLD assignment not found");
  }
  return Number(match[1]);
}

export function parseCodecovThreshold(source: string): number {
  const matches = [...source.matchAll(/^\s*target:\s*["']?(\d+(?:\.\d+)?)%?["']?/gim)].map((match) =>
    Number(match[1]),
  );
  const values = unique(matches);
  if (values.length !== 1) {
    throw new Error(`codecov threshold must be a single value; found ${values.join(", ") || "none"}`);
  }
  return values[0];
}

export function lintCoverageThresholds(options: Partial<Options> = {}): LintResult {
  const rootDir = options.rootDir ?? process.cwd();
  const ssotPath = resolve(rootDir, options.ssotPath ?? DEFAULT_SSOT);
  const executorPath = resolve(rootDir, options.executorPath ?? DEFAULT_EXECUTOR);
  const codecovPath = resolve(rootDir, options.codecovPath ?? DEFAULT_CODECOV);
  const includeCodeCov = options.includeCodeCov ?? existsSync(codecovPath);

  const sources: ThresholdSource[] = [];
  try {
    sources.push({
      kind: "ssot",
      path: ssotPath,
      threshold: parseSsotThreshold(readRequired(ssotPath, "SSOT")),
    });
    sources.push({
      kind: "executor",
      path: executorPath,
      threshold: parseExecutorThreshold(readRequired(executorPath, "executor")),
    });
    if (includeCodeCov) {
      sources.push({
        kind: "codecov",
        path: codecovPath,
        threshold: parseCodecovThreshold(readRequired(codecovPath, "codecov")),
      });
    }
  } catch (error) {
    return {
      ok: false,
      errorKind: "parse",
      message: error instanceof Error ? error.message : String(error),
      sources,
    };
  }

  const ssot = sources.find((source) => source.kind === "ssot");
  if (!ssot) {
    return { ok: false, errorKind: "parse", message: "SSOT source missing after parse", sources };
  }

  const mismatches = sources.filter((source) => source.threshold !== ssot.threshold);
  if (mismatches.length > 0) {
    return { ok: false, errorKind: "drift", threshold: ssot.threshold, sources, mismatches };
  }

  return { ok: true, threshold: ssot.threshold, sources };
}

export const runLint = lintCoverageThresholds;

function parseArgs(argv: string[]): Partial<Options> & { json: boolean } {
  const parsed: Partial<Options> & { json: boolean } = { json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--json") {
      parsed.json = true;
    } else if (arg === "--root") {
      if (!value) throw new Error("--root requires a value");
      parsed.rootDir = value;
      index += 1;
    } else if (arg === "--ssot") {
      if (!value) throw new Error("--ssot requires a value");
      parsed.ssotPath = value;
      index += 1;
    } else if (arg === "--executor") {
      if (!value) throw new Error("--executor requires a value");
      parsed.executorPath = value;
      index += 1;
    } else if (arg === "--codecov") {
      if (!value) throw new Error("--codecov requires a value");
      parsed.codecovPath = value;
      parsed.includeCodeCov = true;
      index += 1;
    } else {
      throw new Error(`unknown arg: ${arg}`);
    }
  }
  return parsed;
}

function formatSource(source: ThresholdSource): string {
  return `${source.kind}\t${source.threshold}%\t${basename(source.path)}`;
}

function main(): void {
  let args: ReturnType<typeof parseArgs>;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`coverage-threshold-lint: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }

  const result = lintCoverageThresholds(args);
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    if (result.ok) {
      return;
    }
    process.exit(result.errorKind === "drift" ? 1 : 2);
  }

  if (result.ok) {
    console.log(`coverage-threshold-lint: OK (sources=${result.sources.length}, threshold=${result.threshold})`);
    for (const source of result.sources) {
      console.log(formatSource(source));
    }
    return;
  }

  if (result.errorKind === "drift") {
    console.error("coverage-threshold-lint: DRIFT detected");
    for (const source of result.sources) {
      console.error(formatSource(source));
    }
    process.exit(1);
  }

  console.error(`coverage-threshold-lint: ${result.message}`);
  for (const source of result.sources) {
    console.error(formatSource(source));
  }
  process.exit(2);
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === thisFile) {
  main();
}
