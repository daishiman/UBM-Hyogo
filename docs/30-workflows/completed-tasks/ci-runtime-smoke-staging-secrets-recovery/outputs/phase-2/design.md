# Phase 2: 設計（実行結果）

## (A) `runtime-smoke-staging.yml` path 修正

error メッセージが指すパスを current `completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` に同期。挙動は同値（文字列のみ）。

## (B) 再発防止 guard `scripts/ci/verify-workflow-doc-refs.sh`

### 責務
`.github/workflows/*.yml` 内の `docs/...md` 参照の repository-local 実在性を検証。

### Interface
- 引数: `--root <repo-root>`（default: `git rev-parse --show-toplevel`）/ `--workflows <dir>`（default: `.github/workflows`）
- 終了コード: 0=OK / 1=missing / 2=usage error
- 出力: PASS 時 `verify-workflow-doc-refs: OK (N references checked across M files)`、FAIL 時 `<workflow>:<line> -> <path>`

### 抽出ルール
- 正規表現: `docs/[A-Za-z0-9_./#-]+\.md(#anchor)?`
- 除外: `https?://...docs/...md` 形式 URL、`outputs/phase-11/evidence/*.md`（runtime 生成物）、`...` プレースホルダ

### 実装方式
- POSIX bash + `grep -nE` / `printf` / `mktemp`（依存追加なし）
- `set -euo pipefail` + `|| true` で `grep` 0-hit 例外を吸収
- tmpfile で report 集約 → bash 互換性確保

## (C) CI workflow `.github/workflows/verify-workflow-doc-refs.yml`

- trigger: `pull_request` + `push: [dev, main]`、paths filter で `.github/workflows/**` / `docs/**/*.md` / guard script 自身
- permissions: `contents: read` のみ
- step: `bash scripts/ci/verify-workflow-doc-refs.sh` + test suite 実行

## (D) Secret 投入

user 単独操作。`bash scripts/smoke/provision-staging-secrets.sh`（op→stdin→`gh secret set`）。AI は手順記述のみ。

## 状態所有権

| 状態 | 所有 |
|------|------|
| secret 実値 | GitHub Environment（user のみ書込） |
| runbook canonical path | リポジトリ |
| 参照一貫性検証 | guard script + CI job |
