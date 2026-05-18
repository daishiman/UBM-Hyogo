# Implementation Guide

## Part 1: 中学生レベル

Vitest が止まった原因は、道具箱の中で「入口の窓口」と「実際に動く職人」の組み合わせがずれていたことです。さらに、自分の作業部屋にある道具ではなく、親フォルダにある古い道具を取りに行ってしまいました。

この仕様では、3 人のチェック係を置きます。1 人目は「今の Node は正しい種類で動いているか」、2 人目は「道具を自分の作業部屋から取っているか」、3 人目は「窓口・職人・名簿の番号が同じか」を確認します。

チェック係は、手元で作業するとき、push する直前、PR の検査で同じことを見ます。これにより、同じズレを早めに見つけられます。

| 専門用語 | 日常語への言い換え |
| --- | --- |
| Vitest | プログラム用の小テスト係 |
| esbuild host | 道具を呼び出す入口の窓口 |
| binary | 実際に手を動かす職人 |
| worktree | 同じ家から分けた作業部屋 |
| node_modules | 道具箱置き場 |
| Rosetta 2 | 別の種類の機械向けに動かす変換器 |

## Part 2: 技術者レベル

### Interfaces

```ts
interface VerifyResult {
  name: "node-arch" | "worktree-isolation" | "esbuild-version";
  status: "ok" | "fail" | "skipped";
  details: Record<string, string>;
}
```

### API Signatures

- `node scripts/verify-node-arch.mjs`: Apple Silicon の darwin だけ `process.arch === "arm64"` を必須化する。
- `node scripts/verify-worktree-node-modules-isolation.mjs`: `createRequire(path.join(process.cwd(), "package.json"))` 起点で `@esbuild/<platform>-<arch>/bin/esbuild` を resolve し、resolved path が `process.cwd()` 配下であることを検証する。
- `node scripts/verify-esbuild-version.mjs`: `esbuild/package.json`、platform binary `--version`、`pnpm-lock.yaml` の `esbuild@x.y.z` を突合する。
- `package.json` root `devDependencies.esbuild = "0.27.3"`: CI の strict pnpm 解決でも verifier が transitive dependency に依存しないようにする。

### Commands

```bash
pnpm verify:node-arch
pnpm verify:worktree-isolation
pnpm verify:esbuild
pnpm verify:vitest-runtime
pnpm test:parallel09-primitives
pnpm test:parallel09-use-admin-mutation
```

### Edge Cases

- Linux CI は `verify-node-arch` を `skipped` として exit 0 にする。
- GitHub Actions runner は `uname -m` と `node -p "process.arch"` を出力し、runner label の暗黙前提を evidence 化する。
- `ESBUILD_BINARY_PATH` は Cloudflare deploy 経路の二次防御として残し、Vitest runbook では unset を明記する。
- parent repository `node_modules` cleanup はユーザー判断の運用手順に留め、AI が自動削除しない。

### Constants

| Constant | Value |
| --- | --- |
| `EXPECTED_NODE_ARCH` | `arm64` on Apple Silicon |
| `ESBUILD_LOCK_SOURCE` | `pnpm-lock.yaml` |
| `ISSUE_REFERENCE_MODE` | `Refs #747` only |
| `PHASE11_EVIDENCE_EXT` | tracked `.txt` |
