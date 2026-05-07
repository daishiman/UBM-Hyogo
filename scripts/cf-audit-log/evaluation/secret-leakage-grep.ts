#!/usr/bin/env tsx
import { readFileSync } from "node:fs";
import process from "node:process";

export interface SecretHit {
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
        hits.push({ line: index + 1, pattern: name, sample: match[0] });
      }
    }
  });
  return { hits };
}

if (process.argv[1]?.endsWith("secret-leakage-grep.ts")) {
  const file = process.argv[2];
  if (!file) throw new Error("file path is required");
  const { hits } = scanForSecrets(file);
  if (hits.length > 0) {
    process.stderr.write(`${JSON.stringify({ ok: false, hits }, null, 2)}\n`);
    process.exit(1);
  }
  process.stdout.write(`${JSON.stringify({ ok: true, hits: [] })}\n`);
}
