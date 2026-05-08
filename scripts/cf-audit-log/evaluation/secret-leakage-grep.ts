#!/usr/bin/env tsx
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

export interface SecretHit {
  file?: string;
  line: number;
  pattern: string;
  sample: string;
}

const patterns: Array<[string, RegExp]> = [
  ["raw-ipv4", /\b(?:\d{1,3}\.){3}\d{1,3}\b/],
  ["email", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ["token-like", /\b[A-Za-z0-9_-]{30,}\b/],
  ["full-user-agent", /\bMozilla\/[^\n"]{8,}/],
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function scanForSecrets(filePath: string): { hits: SecretHit[] } {
  const hits: SecretHit[] = [];
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const [name, pattern] of patterns) {
      const match = pattern.exec(line);
      if (match) {
        if (
          name === "raw-ipv4" &&
          /\.0\/24\b/.test(line.slice(match.index, match.index + match[0].length + 3))
        ) {
          continue;
        }
        if (name === "token-like" && match[0] === "ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL") {
          continue;
        }
        if (name === "token-like" && UUID_PATTERN.test(match[0])) {
          continue;
        }
        hits.push({ line: index + 1, pattern: name, sample: match[0] });
      }
    }
  });
  return { hits };
}

function listInputFiles(inputPath: string): string[] {
  const stat = statSync(inputPath);
  if (stat.isFile()) return [inputPath];
  if (!stat.isDirectory()) return [];
  return readdirSync(inputPath)
    .flatMap((entry) => listInputFiles(join(inputPath, entry)))
    .filter((file) => /\.(json|jsonl|log|md|txt)$/i.test(file));
}

export function scanInputs(inputPaths: string[]): { hits: SecretHit[] } {
  const hits = inputPaths.flatMap((inputPath) =>
    listInputFiles(inputPath).flatMap((filePath) =>
      scanForSecrets(filePath).hits.map((hit) => ({ ...hit, file: filePath })),
    ),
  );
  return { hits };
}

function printResult(hits: SecretHit[], countOnly: boolean): void {
  if (countOnly) {
    process.stdout.write(`${hits.length}\n`);
    return;
  }
  if (hits.length > 0) {
    process.stderr.write(`${JSON.stringify({ ok: false, hits }, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify({ ok: true, hits: [] })}\n`);
}

if (process.argv[1]?.endsWith("secret-leakage-grep.ts")) {
  const args = process.argv.slice(2);
  // --exit-on-detect は明示契約フラグ。既定挙動も exit 1 で fail する（互換維持）。
  void args.includes("--exit-on-detect");
  const countOnly = args.includes("--count-only");
  const useStdin = args.includes("--stdin");
  const inputs = args.filter((a) => !a.startsWith("--"));
  let tmpDir: string | undefined;
  if (useStdin) {
    tmpDir = mkdtempSync(join(tmpdir(), "secret-leakage-grep-"));
    const stdinPath = join(tmpDir, "stdin.txt");
    writeFileSync(stdinPath, readFileSync(0, "utf8"));
    inputs.push(stdinPath);
  }
  if (inputs.length === 0) throw new Error("file path is required");
  const { hits } = scanInputs(inputs);
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  if (hits.length > 0) {
    printResult(hits, countOnly);
    process.exit(1);
  }
  printResult(hits, countOnly);
}
