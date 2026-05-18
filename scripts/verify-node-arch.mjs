#!/usr/bin/env node
import os from 'node:os';

const isDarwin = process.platform === 'darwin';
if (!isDarwin) {
  console.log(`[verify-node-arch] SKIP: platform=${process.platform} (Apple Silicon check only)`);
  process.exit(0);
}

const cpuModel = os.cpus()[0]?.model ?? '';
const isAppleSilicon = /Apple/i.test(cpuModel);
if (!isAppleSilicon) {
  console.log(`[verify-node-arch] SKIP: non-Apple-Silicon darwin host (cpu=${cpuModel})`);
  process.exit(0);
}

if (process.arch !== 'arm64') {
  console.error(`[verify-node-arch] FAIL: process.arch=${process.arch}, expected arm64`);
  console.error(`Hint: mise が Rosetta 2 経由の x64 Node を install しています。`);
  console.error(`     terminal を arm64 native で起動し、mise install を再実行してください。`);
  console.error(`     詳細: docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md §4`);
  process.exit(1);
}

console.log(`[verify-node-arch] OK: arm64 (cpu=${cpuModel})`);
process.exit(0);
