#!/usr/bin/env node
import { createRequire } from 'node:module';
import path from 'node:path';

const cwd = process.cwd();
const require = createRequire(path.join(cwd, 'package.json'));

const pkg = `@esbuild/${process.platform}-${process.arch}`;
const subpath = process.platform === 'win32' ? 'esbuild.exe' : 'bin/esbuild';
const specifier = `${pkg}/${subpath}`;

let resolved;
try {
  resolved = require.resolve(specifier);
} catch {
  console.error(`[verify-worktree-isolation] FAIL: cannot resolve ${specifier}`);
  console.error(`Hint: ワークツリー内で 'pnpm install' を実行してください。`);
  console.error(`     詳細: docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md §3`);
  process.exit(1);
}

if (!resolved.startsWith(cwd + path.sep)) {
  console.error(`[verify-worktree-isolation] FAIL: ${pkg} resolved outside cwd`);
  console.error(`  cwd     : ${cwd}`);
  console.error(`  resolved: ${resolved}`);
  console.error(`Hint: 親ディレクトリの node_modules が漏れ込んでいます。`);
  console.error(`     pnpm install をワークツリー内で再実行するか、runbook の escalation 1〜5 を参照してください。`);
  console.error(`     詳細: docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md §3`);
  process.exit(1);
}

console.log(`[verify-worktree-isolation] OK: ${pkg} resolved inside cwd`);
console.log(`  resolved: ${resolved}`);
process.exit(0);
