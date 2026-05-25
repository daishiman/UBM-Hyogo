import fs from "node:fs";
import path from "node:path";
import type { CanonicalSentryPolicy } from "./types.ts";
import { canonicalizeSentryPolicy } from "./canonicalize.ts";

function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => path.join(dir, file));
}

export function loadExpected(repoRoot: string): CanonicalSentryPolicy[] {
  return listJsonFiles(path.join(repoRoot, "infra/sentry-alerts/policies")).map((file) =>
    canonicalizeSentryPolicy(readJson(file)),
  );
}
