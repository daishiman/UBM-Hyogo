# Phase 9 — quality-gate.md

## Status

completed

## ゲート定義

### QG-A: `lefthook.yml` 構文ゲート

| 項目 | 内容 |
| --- | --- |
| 検証対象 | `lefthook.yml` |
| 実行コマンド | `pnpm lefthook validate` または `lefthook dump` |
| 合格条件 | (a) `min_version: 1.6.0` 以上、(b) `pre-commit` / `post-merge` の supported hook lane が定義、(c) 各 lane に `commands` キーと kebab-case コマンド名が存在、(d) `output:` セクションが `meta` / `summary` / `failure` を含む |
| 失敗時挙動 | yaml lint エラー → 該当行修正 → 再実行 |
| 実行タイミング | 本タスクの Phase 11 / CI |

### QG-B: shell スクリプト shellcheck ゲート

| 項目 | 内容 |
| --- | --- |
| 検証対象 | `scripts/hooks/staged-task-dir-guard.sh` / `scripts/hooks/stale-worktree-notice.sh` |
| 実行コマンド | `shellcheck -x scripts/hooks/*.sh` |
| 合格条件 | error / warning ゼロ。SC2086（quote 抜け）/ SC2155（declare and assign）/ SC2046（word splitting）に特に注意 |
| shebang | `#!/usr/bin/env bash` + `set -euo pipefail` |
| 失敗時挙動 | 指摘行を修正。disable directive は最小限のみ許可（理由コメント必須） |

### QG-C: artifacts.json と outputs 1:1 対応ゲート

| 項目 | 内容 |
| --- | --- |
| 検証対象 | `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/artifacts.json` の `phases[].outputs` |
| 検証手順 | 1. `artifacts.json` を読み、各 Phase の `outputs[]` を集合 A とする / 2. `outputs/phase-*/` の実ファイルを集合 B とする / 3. `A == B` を確認 |
| 合格条件 | A と B が完全一致（不足・余剰なし） |
| 現状 | 本 Phase の実行で Phase 8 / 9 / 10 / 11 の全 outputs を実ファイルとして作成し PASS |

### QG-D: `generate-index.js` 依存切離しゲート

| 項目 | 内容 |
| --- | --- |
| 検証対象 | `lefthook.yml` 全行・`scripts/hooks/*.sh` 全行 |
| 検証コマンド | `grep -nE '(generate-index\|aiworkflow-requirements/scripts)' lefthook.yml scripts/hooks/*.sh` |
| 合格条件 | grep ヒット 0 件（hook 経路から `generate-index.js` への参照が完全に切れている） |
| 補足 | `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` 自体は維持。skill 側 / `package.json :: indexes:rebuild` script からのみ呼ばれる |
| 失敗時挙動 | 該当行を削除し、`pnpm indexes:rebuild` 経由のオプトイン実行に置換 |

## 補助ゲート（docs 整合）

### Line budget

| 対象 | 上限目安 | 現状 |
| --- | --- | --- |
| 各 phase main.md | 500 行 | 全て < 200 行 |
| design.md / review.md など detail | 500 行 | 全て < 250 行 |

### 内部リンク健全性

`outputs/phase-N/*.md` 内の相対リンク（`outputs/phase-M/...` / `CLAUDE.md` / `scripts/...`）は実在パスのみを参照。リンク切れ検査は Phase 11 link-checklist で実施。

### Mirror parity

各 Phase の `main.md` は detail 子ファイル（`design.md` / `review.md` / `before-after.md` / `quality-gate.md` / `go-no-go.md` / `manual-smoke-log.md` / `link-checklist.md`）を本文から明示参照する。

### YAML lint（仕様内コードブロック）

`outputs/phase-2/design.md` 内の yaml ブロックはキー重複・インデント不整合なし。実バイナリ検証は Phase 11 で `pnpm exec lefthook validate` を実測する。

## 失敗時のフォールバック

| ゲート | フォールバック |
| --- | --- |
| QG-A | yaml 構文修正 → 再 commit。`min_version` 不足は lefthook を up-to-date 化 |
| QG-B | shellcheck disable directive は最小範囲。理由コメント必須 |
| QG-C | 不足ファイルを新規作成、余剰は `artifacts.json` に追記して整合させる |
| QG-D | `lefthook.yml` から node 呼び出しを除去し `package.json :: indexes:rebuild` に移譲 |
