# Phase 3: 設計 / モジュール俯瞰

## 3.1 verify script の責務分割

### 3.1.1 `scripts/verify-node-arch.mjs`

**目的**: Apple Silicon host で `process.arch === 'arm64'` を保証する。

**主要シグネチャ（pseudo）**:

```js
// scripts/verify-node-arch.mjs
const isDarwin = process.platform === 'darwin';
if (!isDarwin) process.exit(0);

const isAppleSilicon = await detectAppleSilicon(); // os.cpus()[0].model に 'Apple' を含む
if (!isAppleSilicon) process.exit(0);

if (process.arch !== 'arm64') {
  console.error(`[verify-node-arch] FAIL: process.arch=${process.arch}, expected arm64`);
  console.error(`Hint: mise が Rosetta 2 経由の x64 Node を install しています。`);
  console.error(`     terminal を arm64 native で起動し、mise install を再実行してください。`);
  process.exit(1);
}
console.log('[verify-node-arch] OK: arm64');
```

**入出力**: 引数なし / stdout に状態 / exit 0 = pass, exit 1 = fail。

### 3.1.2 `scripts/verify-worktree-node-modules-isolation.mjs`

**目的**: 現 CWD の Node プロセスが esbuild binary を resolve した時、その絶対パスが CWD 配下にあることを保証する。

```js
// scripts/verify-worktree-node-modules-isolation.mjs
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const pkg = `@esbuild/${process.platform}-${process.arch}`;
const subpath = process.platform === 'win32' ? 'esbuild.exe' : 'bin/esbuild';

let resolved;
try {
  resolved = require.resolve(`${pkg}/${subpath}`);
} catch (e) {
  console.error(`[verify-worktree-isolation] FAIL: cannot resolve ${pkg}/${subpath}`);
  process.exit(1);
}

const cwd = process.cwd();
if (!resolved.startsWith(cwd + path.sep)) {
  console.error(`[verify-worktree-isolation] FAIL: ${pkg} resolved outside cwd`);
  console.error(`  cwd     : ${cwd}`);
  console.error(`  resolved: ${resolved}`);
  console.error(`Hint: 親ディレクトリの node_modules が漏れ込んでいます。`);
  console.error(`     pnpm install をワークツリー内で再実行するか、runbook の escalation 1〜5 を参照してください。`);
  process.exit(1);
}
console.log(`[verify-worktree-isolation] OK: ${pkg} resolved inside cwd`);
```

### 3.1.3 `scripts/verify-esbuild-version.mjs`

**目的**: host / binary / lock 3 者の version 一致を保証する。

```js
// scripts/verify-esbuild-version.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const require = createRequire(`${process.cwd()}/package.json`);
const hostVersion = require('esbuild/package.json').version;

const binPkg = `@esbuild/${process.platform}-${process.arch}`;
const binPath = require.resolve(`${binPkg}/bin/esbuild`);
const binVersion = execFileSync(binPath, ['--version']).toString().trim();

const lockContent = readFileSync(`${process.cwd()}/pnpm-lock.yaml`, 'utf8');
const lockMatch = lockContent.match(/^\s+esbuild@([\d.]+):/m);
const lockVersion = lockMatch?.[1];

const ok = hostVersion === binVersion && binVersion === lockVersion;
console.log(`host=${hostVersion} bin=${binVersion} lock=${lockVersion} -> ${ok ? 'OK' : 'FAIL'}`);
process.exit(ok ? 0 : 1);
```

> 注: 外部依存を増やさず、`pnpm-lock.yaml` は regex 抽出のみで扱う。

## 3.2 lefthook 統合

```yaml
# lefthook.yml の pre-push に追加
pre-push:
  commands:
    verify-esbuild:
      run: |
        node scripts/verify-node-arch.mjs && \
        node scripts/verify-worktree-node-modules-isolation.mjs && \
        node scripts/verify-esbuild-version.mjs
      skip:
        - merge
        - rebase
```

## 3.3 GitHub Actions 統合

```yaml
# .github/workflows/verify-esbuild.yml
name: verify-esbuild
on:
  pull_request:
  push:
    branches: [dev, main]
jobs:
  verify:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-14]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24.15.0
      - run: pnpm install --frozen-lockfile
      - run: uname -m && node -p "process.platform + ' ' + process.arch"
      - run: pnpm verify:node-arch
      - run: pnpm verify:worktree-isolation
      - run: pnpm verify:esbuild
      - run: pnpm test:parallel09-primitives
      - run: pnpm test:parallel09-use-admin-mutation
```

## 3.4 `.mise.toml` arch hint

mise 公式 syntax 確認後、以下のいずれかを採用:

- 案 A: `node = { version = "24.15.0", postinstall = "node scripts/verify-node-arch.mjs" }`
- 案 B: `[tools.node]` に arch 制約を書ける mise version であればその構文。
- どちらも、verifier 単体で fail 検知できる設計とする（mise 側はベストエフォート）。

## 3.5 完了条件（Phase 3）

- 3 verify script のシグネチャと出力契約が確定
- lefthook / CI / mise の統合方法が確定
- 各 verify が CWD と arch を正しく扱える設計になっている
