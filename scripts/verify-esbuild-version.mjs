#!/usr/bin/env node
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const require = createRequire(path.join(cwd, 'package.json'));

let hostVersion = '';
try {
  hostVersion = require('esbuild/package.json').version ?? '';
} catch {
  console.error(`[verify-esbuild] FAIL: cannot load esbuild/package.json from ${cwd}`);
  process.exit(1);
}

const binPkg = `@esbuild/${process.platform}-${process.arch}`;
const binSubpath = process.platform === 'win32' ? 'esbuild.exe' : 'bin/esbuild';

let binPath = '';
let binVersion = '';
try {
  binPath = require.resolve(`${binPkg}/${binSubpath}`);
  binVersion = execFileSync(binPath, ['--version']).toString().trim();
} catch (e) {
  console.error(`[verify-esbuild] FAIL: cannot resolve / execute ${binPkg}/${binSubpath}`);
  console.error(`  reason: ${(e && e.message) || e}`);
  process.exit(1);
}

let lockVersion = '';
try {
  const lockContent = readFileSync(path.join(cwd, 'pnpm-lock.yaml'), 'utf8');
  const lockMatch = lockContent.match(/^\s+esbuild@([\d.]+):/m);
  lockVersion = lockMatch?.[1] ?? '';
} catch {
  console.error(`[verify-esbuild] FAIL: cannot read pnpm-lock.yaml at ${cwd}`);
  process.exit(1);
}

const ok = hostVersion !== '' && hostVersion === binVersion && binVersion === lockVersion;
console.log(`host=${hostVersion} bin=${binVersion} lock=${lockVersion} -> ${ok ? 'OK' : 'FAIL'}`);
if (!ok) {
  console.error(`Hint: pnpm-lock.yaml を正本として host / binary を揃えてください。`);
  console.error(`     binary path: ${binPath}`);
  console.error(`     詳細: docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md §3`);
}
process.exit(ok ? 0 : 1);
