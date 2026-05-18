# Issue #747 Vitest esbuild arch & worktree isolation alignment

[実装区分: 実装仕様書]

> 本仕様書はユーザー入力では「docs-only」想定だったが、CONST_004 に基づき
> **目的（focused Vitest spec 2 本を exit 0 にする）の達成にはコード変更が必須**であるため
> 実装仕様書として作成する。判断根拠:
> - 本タスクの DoD「focused Vitest 2 spec exit 0」は script / wrangler config / lefthook / CI workflow への実装変更なしには実現不能
> - 当時の仕様書（`docs/30-workflows/unassigned-task/parallel-09-followup-002-vitest-esbuild-version-alignment.md`）が前提とした「単純な version mismatch」ではなく、worktree node_modules 漏れ込み + Node arch x64/arm64 mismatch が真因と判明したため、真因に即した検証スクリプトと CI gate を新規実装する必要がある

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-747-vitest-esbuild-arch-and-worktree-isolation |
| source issue | #747（CLOSED 維持、`Refs #747` のみ） |
| source unassigned task | `docs/30-workflows/unassigned-task/parallel-09-followup-002-vitest-esbuild-version-alignment.md`（本 wave で `consumed` 化し、本 canonical root へ pointer 追加） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_runtime_blocked_node_arch |
| evidence_state | PARTIAL_LOCAL_EVIDENCE_NODE_ARCH_BLOCKED |
| 実装対象 | `scripts/verify-esbuild-version.mjs`(new); `scripts/verify-worktree-node-modules-isolation.mjs`(new); `scripts/verify-node-arch.mjs`(new); `.mise.toml`(edit); `lefthook.yml`(edit); `.github/workflows/verify-esbuild.yml`(new); `package.json`(edit: root `esbuild@0.27.3` devDependency + scripts); `pnpm-lock.yaml`(edit); `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md`(new); `CLAUDE.md`(edit, runbook 参照追記のみ); `docs/30-workflows/unassigned-task/parallel-09-followup-002-vitest-esbuild-version-alignment.md`(edit, consumed pointer) |
| 作成日 | 2026-05-17 |
| Phase 13 | blocked_pending_user_approval |

## Summary

Issue #747 の真の根本原因は **3 層複合**である:

1. **Node arch mismatch**: `mise` で install された Node 24.15.0 が **x64 (Rosetta 2 経由)** で動作している (`process.arch === 'x64'`)。これにより esbuild host (`node_modules/esbuild/lib/main.js`) は `@esbuild/darwin-x64` を `require.resolve` する。
2. **Worktree node_modules 漏れ込み**: 現在のワークツリー `node_modules/@esbuild/` には `darwin-arm64` しか install されていない。Node module resolution が `..` を遡って **親リポジトリ `/Users/dm/dev/dev/個人開発/UBM-Hyogo/node_modules/@esbuild/darwin-x64/`** を引き当てる。
3. **親リポジトリの esbuild version drift**: 親側 `@esbuild/darwin-x64` は **0.25.4**。ワークツリー host 0.27.3 と version 不一致で abort。

当時の仕様書 (`parallel-09-followup-002-...md`) は「host/binary version mismatch」と表現していたが、観察された fail はその結果でしかなく、原因は **arch + worktree topology** にある。

本タスクは:

- (A) `process.arch` が arm64 であることを保証する verify script（`.mise.toml` の Node binary が arm64 native であることを保証）
- (B) worktree から **親ディレクトリの `node_modules` への module resolution 漏れ込み**を検出する verify script（`require.resolve('@esbuild/<arch>/bin/esbuild')` の絶対パスがワークツリー配下であることを assert）
- (C) host / binary / `pnpm-lock.yaml` 3 者の esbuild version 整合を検証する verify script
- (D) root `esbuild@0.27.3` devDependency を固定し、CI の strict pnpm 解決でも verifier が transitive dependency に依存しないようにする
- (E) (A)(B)(C) を `lefthook` pre-push と GitHub Actions `verify-esbuild` の両方に gate として配置
- (F) focused Vitest 2 spec の exit 0 evidence 取得手順を root `package.json` scripts として固定
- (G) `scripts/cf.sh` の `ESBUILD_BINARY_PATH` と Vitest 実行の干渉ポリシーを runbook に明文化

を 1 サイクル内で完了させる。

## Scope

### 含む

- `scripts/verify-node-arch.mjs` 新規追加（`process.arch === 'arm64'` を Apple Silicon ホストで強制）
- `scripts/verify-worktree-node-modules-isolation.mjs` 新規追加（`require.resolve` の絶対パスがリポジトリ root 配下にあることを assert）
- `scripts/verify-esbuild-version.mjs` 新規追加（host / binary / lock 3 者一致を assert）
- `.mise.toml` の `[tools]` セクションに `node` の arch hint を追記（`arm64` 明示）
- `lefthook.yml` の `pre-push` に `verify-esbuild` job を追加
- `.github/workflows/verify-esbuild.yml` 新規追加（PR / push gate）
- `package.json` の `scripts` に `verify:esbuild` / `verify:node-arch` / `verify:worktree-isolation` / focused Vitest scripts を追加し、root `esbuild@0.27.3` devDependency を契約化
- `pnpm-lock.yaml` root importer に `esbuild@0.27.3` を追加
- runbook (`docs/30-workflows/issue-747-.../runbook.md`) に escalation 1〜5 + Rosetta 2 検知手順 + `ESBUILD_BINARY_PATH` 干渉対策
- focused Vitest 2 spec exit 0 evidence の取得手順と Phase 11 evidence canonical path

### 含まない

- Vitest / Vite / esbuild の major version upgrade
- 新規 spec の追加（parallel-09 既存 spec 2 本の復旧のみ）
- Playwright / visual harness の調整
- `unassigned-task/parallel-09-followup-002-...md` の物理削除（status `consumed` 化は本 wave で実施し、既存リンクを保持）
- 親リポジトリ root の `node_modules` クリーンアップ（runbook で手順記載のみ。実行はユーザー判断）

## 不変条件（CONST）

- CONST-A: focused Vitest 2 spec が exit 0 で完走できること（AC-1, AC-2）
- CONST-B: `verify-esbuild` / `verify-node-arch` / `verify-worktree-isolation` が CI gate と lefthook の両方で fail 検出できること（AC-4）
- CONST-C: 既存の `scripts/cf.sh` 機能を破壊しない（`ESBUILD_BINARY_PATH` の global esbuild 解決は引き続き Cloudflare deploy 経路で必要）
- CONST-D: pnpm-lock.yaml の esbuild version (0.27.3) を正本とし、host / binary はこの値に揃える
- CONST-E: `unassigned-task/parallel-09-followup-002-...md` で言及されていた「host/binary version mismatch」は **症状** であり、本タスクは **arch + worktree topology** を根本原因として扱う

## Phase 一覧

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-01.md` | spec_created |
| 2 | `outputs/phase-02.md` | spec_created |
| 3 | `outputs/phase-03.md` | spec_created |
| 4 | `outputs/phase-04.md` | spec_created |
| 5 | `outputs/phase-05.md` | completed |
| 6 | `outputs/phase-06.md` | completed |
| 7 | `outputs/phase-07.md` | completed |
| 8 | `outputs/phase-08.md` | runtime_blocked_node_arch |
| 9 | `outputs/phase-09.md` | completed |
| 10 | `outputs/phase-10.md` | completed |
| 11 | `outputs/phase-11.md` | partial_local_evidence_node_arch_blocked |
| 12 | `outputs/phase-12.md` | completed |
| 13 | `outputs/phase-13.md` | blocked_pending_user_approval |

## 関連参照

- `docs/30-workflows/unassigned-task/parallel-09-followup-002-vitest-esbuild-version-alignment.md`（前身仕様書、本 wave で `consumed` 化）
- `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx`
- `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx`
- `scripts/cf.sh`（`ESBUILD_BINARY_PATH` 設計の原典）
- `CLAUDE.md`（Node 24 / pnpm 10 固定、`scripts/cf.sh` ラッパー方針）
- `pnpm-lock.yaml`（esbuild 0.27.3 正本）
