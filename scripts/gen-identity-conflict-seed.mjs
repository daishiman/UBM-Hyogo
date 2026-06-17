#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  buildIdentityConflictCleanupSql,
  buildIdentityConflictSeedSql,
} from "../apps/api/src/testing/identity-conflicts/index.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputs = [
  ["apps/api/migrations/seed/identity-conflict-staging-seed.sql", buildIdentityConflictSeedSql()],
  ["apps/api/migrations/seed/identity-conflict-cleanup.sql", buildIdentityConflictCleanupSql()],
];

const check = process.argv.includes("--check");
let drift = false;

for (const [relativePath, content] of outputs) {
  const absolutePath = resolve(root, relativePath);
  if (check) {
    const current = await readFile(absolutePath, "utf8").catch(() => "");
    if (current !== content) {
      console.error(`drift: ${relativePath}`);
      drift = true;
    }
    continue;
  }
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content);
  console.log(`wrote ${relativePath}`);
}

if (drift) process.exit(1);
