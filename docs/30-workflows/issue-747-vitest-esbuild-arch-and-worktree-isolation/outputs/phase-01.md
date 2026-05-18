# Phase 1: 要件定義 / Current Baseline

## 1.1 目的

parallel-09 で追加した focused Vitest spec 2 本を **exit 0** で実行可能にし、その状態が drift しない gate を整備する。Issue #747 が close 済みであっても、現行 worktree で再現する **真の根本原因**（arch + 親 `node_modules` 漏れ込み）を解決する。

## 1.2 Current Baseline（2026-05-17 観察値）

| 項目 | 観察値 | 期待値 | 一致 |
| --- | --- | --- | --- |
| `process.platform` | `darwin` | `darwin` | ✓ |
| `process.arch`（ワークツリーの mise Node） | `x64` | `arm64`（Apple Silicon host） | ✗ |
| host `require('esbuild/package.json').version` | `0.27.3` | `0.27.3` | ✓ |
| worktree `node_modules/@esbuild/darwin-arm64/bin/esbuild --version` | `0.27.3` | `0.27.3` | ✓ |
| worktree `node_modules/@esbuild/darwin-x64/` | 存在しない | 存在しない（arm64 host のため不要） | ✓ |
| host が実際に spawn する binary | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/node_modules/@esbuild/darwin-x64/bin/esbuild` （**親リポジトリ**） | worktree 配下 | ✗ |
| その binary の `--version` | `0.25.4` | `0.27.3` | ✗ |
| focused Vitest 起動 | `Cannot start service: Host version "0.27.3" does not match binary version "0.25.4"` | exit 0 | ✗ |

## 1.3 真の根本原因（3 層複合）

1. **Node arch mismatch**: `mise install` で取得した Node 24.15.0 binary が x64 build で、Rosetta 2 経由で動作している。`process.arch === 'x64'`。
2. **Worktree node_modules 漏れ込み**: Node module resolution は CWD から `..` を遡って `node_modules` を探す。ワークツリーは `<repo>/.worktrees/task-*/` 配下に存在し、worktree の `node_modules` で `@esbuild/darwin-x64` が見つからないと **親リポジトリ root の `node_modules/@esbuild/darwin-x64/`** を引き当てる。
3. **親リポジトリ esbuild version drift**: 親側 `@esbuild/darwin-x64` は `0.25.4` で worktree host `0.27.3` と不一致。

## 1.4 当時の仕様書との差分

| 項目 | unassigned-task/parallel-09-followup-002-...md | 本仕様書 |
| --- | --- | --- |
| 真因 | 「host/binary version mismatch」 | 「Node arch x64 + worktree resolution 漏れ込み + 親リポジトリ version drift」の 3 層複合 |
| 対策 | `pnpm install --force` / `pnpm rebuild esbuild` / `pnpm dedupe` 等の escalation | arch verifier + worktree isolation verifier + version verifier の 3 gate を CI / lefthook 両方に設置 |
| 残課題 | escalation 後も再発するリスク | arch & topology に踏み込んだ root cause 解消 |

## 1.5 完了条件（Phase 1）

- 上記 Current Baseline 表が現行 worktree で再観察できる
- 真の根本原因 3 層が文書として記録されている
- 当時仕様書との差分が明示されている

## 1.6 evidence パス

- `outputs/phase-11/evidence/baseline-arch.txt`（`node -e "console.log(process.arch)"` の出力）
- `outputs/phase-11/evidence/baseline-spawn-trace.txt`（child_process.spawn フック付き trace）
- `outputs/phase-11/evidence/baseline-esbuild-versions.txt`（host / binary / lock 3 者）
