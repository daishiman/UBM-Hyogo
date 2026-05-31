#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_MIGRATIONS_DIR = 'apps/api/migrations';
const DEFAULT_EXCEPTIONS_FILE = 'apps/api/migrations/sequence-exceptions.json';
const MIGRATION_RE = /^(\d{4})_.+\.sql$/;

export async function verifyD1MigrationSequence({
  cwd = process.cwd(),
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
  exceptionsFile = DEFAULT_EXCEPTIONS_FILE,
} = {}) {
  const dirPath = path.resolve(cwd, migrationsDir);
  const fileNames = (await readdir(dirPath))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  const invalidNames = fileNames.filter((fileName) => !MIGRATION_RE.test(fileName));
  const byPrefix = new Map();
  for (const fileName of fileNames) {
    const prefix = fileName.match(MIGRATION_RE)?.[1];
    if (!prefix) continue;
    const group = byPrefix.get(prefix) ?? [];
    group.push(fileName);
    byPrefix.set(prefix, group);
  }

  const duplicateGroups = [...byPrefix.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([prefix, files]) => ({ prefix, files }));

  const exceptions = await readExceptions(path.resolve(cwd, exceptionsFile));
  const exceptionByPrefix = new Map(exceptions.duplicates.map((entry) => [entry.prefix, entry]));

  const unregisteredDuplicates = duplicateGroups.filter(({ prefix, files }) => {
    const entry = exceptionByPrefix.get(prefix);
    if (!entry) return true;
    return !sameSet(files, entry.files);
  });

  const staleExceptions = exceptions.duplicates.filter((entry) => {
    const group = duplicateGroups.find(({ prefix }) => prefix === entry.prefix);
    return !group || !sameSet(group.files, entry.files);
  });

  const missingRationale = exceptions.duplicates.filter((entry) => {
    return typeof entry.rationale !== 'string' || entry.rationale.trim().length < 12;
  });

  return {
    ok: invalidNames.length === 0 &&
      unregisteredDuplicates.length === 0 &&
      staleExceptions.length === 0 &&
      missingRationale.length === 0,
    fileCount: fileNames.length,
    duplicateGroups,
    invalidNames,
    unregisteredDuplicates,
    staleExceptions,
    missingRationale,
  };
}

async function readExceptions(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.duplicates)) {
    throw new Error(`${filePath}: expected { "duplicates": [...] }`);
  }
  return {
    duplicates: parsed.duplicates.map((entry) => ({
      prefix: String(entry.prefix ?? ''),
      files: Array.isArray(entry.files) ? [...entry.files].map(String).sort() : [],
      rationale: String(entry.rationale ?? ''),
    })),
  };
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function formatGroup({ prefix, files }) {
  return `${prefix}: ${files.join(', ')}`;
}

async function main() {
  const result = await verifyD1MigrationSequence();
  if (result.ok) {
    console.log(
      `[verify-d1-migration-sequence] OK: ${result.fileCount} migrations, ` +
        `${result.duplicateGroups.length} documented duplicate prefix group(s)`,
    );
    return;
  }

  console.error('[verify-d1-migration-sequence] FAIL');
  if (result.invalidNames.length > 0) {
    console.error(`invalid migration names: ${result.invalidNames.join(', ')}`);
  }
  if (result.unregisteredDuplicates.length > 0) {
    console.error('unregistered duplicate prefixes:');
    for (const group of result.unregisteredDuplicates) {
      console.error(`  - ${formatGroup(group)}`);
    }
  }
  if (result.staleExceptions.length > 0) {
    console.error('stale duplicate exceptions:');
    for (const entry of result.staleExceptions) {
      console.error(`  - ${formatGroup(entry)}`);
    }
  }
  if (result.missingRationale.length > 0) {
    console.error('duplicate exceptions missing rationale:');
    for (const entry of result.missingRationale) {
      console.error(`  - ${entry.prefix}`);
    }
  }
  process.exitCode = 1;
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  main().catch((error) => {
    console.error(`[verify-d1-migration-sequence] FAIL: ${error?.message ?? error}`);
    process.exit(1);
  });
}
