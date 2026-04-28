# Phase 12 — system-spec-update-summary

## Status

completed

## 概要

本タスクは implementation / NON_VISUAL ワークフローのため、`apps/api` / `apps/web` の I/F、D1 schema、UI route、secrets のいずれも変更しない。system spec の正本更新は `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md`、運用ガイド、両 skill の `LOGS.md` に反映する。

task-specification-creator skill の Phase 12 では、system spec sync のための Step 1-A〜1-G と新規 I/F 追加判定（Step 2A/2B）を必ず通す。以下に workflow-local と global skill sync の完了記録、および N/A 判定の根拠を残す。

## Step 1 — system spec sync（workflow-local 差分の取り込み）

### Step 1-A：実装影響の特定

| 対象 | 影響 | 根拠 |
| --- | --- | --- |
| API endpoint | なし | 本タスクは implementation。`apps/api` 配下に変更なし |
| D1 schema | なし | テーブル / マイグレーション追加なし |
| UI route | なし | `apps/web` 配下に変更なし |
| Cloudflare bindings | なし | `wrangler.toml` の binding 追加なし |
| Secrets | なし | 1Password / GitHub Secrets / Cloudflare Secrets の追加なし |
| Invariants | なし | CLAUDE.md「重要な不変条件」7 項目に変更なし |

→ **完了**: 影響範囲が「docs と DevEx ツール（lefthook / scripts/hooks）」に限定されることを確定。

### Step 1-B：spec へ反映した差分

| 抽出項目 | 反映先 | 結果 |
| --- | --- | --- |
| Git hook 正本を `lefthook.yml` に統一 | `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md` | 反映済み |
| post-merge での indexes 自動再生成停止 | 同上 | 反映済み |
| indexes 再生成を明示コマンドへ分離 | 同上 | 反映済み |
| 本タスクの skill feedback / close-out 記録 | `.claude/skills/task-specification-creator/LOGS.md`, `.claude/skills/aiworkflow-requirements/LOGS.md` | 反映済み |

→ **完了**: 本タスクで正本化できる DevOps 運用仕様、skill feedback、`package.json` / `.gitignore` / `lefthook.yml` / `scripts/hooks/*.sh` / `scripts/new-worktree.sh` の実ファイル変更は same-wave で反映済み。

### Step 1-C：spec sync の実行記録

本タスクは implementation ワークフローのため、Phase 12 における spec sync の実体は **実コード・運用ガイド・本ワークフロー outputs の整合性確保** である。具体的には以下を確認した：

- `outputs/phase-1/main.md` の不変条件と `outputs/phase-2/design.md` の lefthook 設計が矛盾しない
- `outputs/phase-3/review.md` の MINOR 指摘 4 件（M-01〜M-04）が Phase 12 で全て言及されている
  - M-01: implementation-guide 2.4 / unassigned-task-detection で言及
  - M-02: implementation-guide 2.3 で `prepare` script 新設として明記
  - M-03: implementation-guide 2.5 周知方法で対応
  - M-04: `docs/30-workflows/unassigned-task/task-verify-indexes-up-to-date-ci.md` で正式未タスク化
- `artifacts.json` の `acceptance_criteria` 4 件が outputs 全体で網羅されている

→ **完了**: workflow-local の整合性が取れていることを Phase 12 時点で確認。

### Step 1-D：skill sync 実更新

| 対象 | 更新内容 | 状態 |
| --- | --- | --- |
| `task-specification-creator/LOGS.md` | 本タスクで検出した Phase 状態同期、共通骨格、future wording 排除の close-out 記録 | completed |
| `aiworkflow-requirements/LOGS.md` | post-merge indexes 再生成廃止と lefthook 正本化の仕様同期記録 | completed |
| `aiworkflow-requirements/references/technology-devops-core.md` | Git hook 運用正本、CI 代替ゲート、明示 indexes rebuild 方針を追記 | completed |

### Step 1-E：current / baseline 分離

| 区分 | 内容 |
| --- | --- |
| current | 本ワークフロー outputs、DevOps 正本、skill LOGS に反映済みの仕様 |
| baseline | 既存 worktree に残る旧 `.git/hooks/*` と post-merge 自動再生成。各 worktree で `pnpm install` / `lefthook install` を再実行するまで残る |
| migration | `CLAUDE.md` と `doc/00-getting-started-manual/lefthook-operations.md` の runbook に従い、既存 worktree へ順次再配布する |

### Step 1-F：Phase 10 MINOR 追跡

| MINOR ID | 追跡結果 | 状態 |
| --- | --- | --- |
| M-10-1 | CI `verify-indexes-up-to-date` job は `docs/30-workflows/unassigned-task/task-verify-indexes-up-to-date-ci.md` に正式化 | completed |
| M-10-2 | `lefthook-local.yml` / `.gitignore` は implementation-guide と DevOps 正本に反映 | completed |
| M-10-3 | 既存 worktree reinstall 周知は implementation-guide と runbook に反映 | completed |

### Step 1-G：検証コマンド

| コマンド | 結果 |
| --- | --- |
| `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/task-git-hooks-lefthook-and-post-merge` | PASS |
| `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/task-git-hooks-lefthook-and-post-merge --strict --json` | PASS |
| `mise exec -- pnpm exec lefthook validate` | PASS |
| `bash -n scripts/hooks/staged-task-dir-guard.sh scripts/hooks/stale-worktree-notice.sh` | PASS |
| `rg -n "(generate-index\|aiworkflow-requirements/scripts)" lefthook.yml scripts/hooks` | no hook-path match |
| `rg -n "仕様策定のみ\|実行予定\|保留として記録" docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/` | no future wording |

## Step 2 — 新規 I/F 追加判定

### 判定: **N/A（新規 I/F 追加なし）**

#### 根拠

| I/F カテゴリ | 追加の有無 | 根拠 |
| --- | --- | --- |
| HTTP API endpoint（`apps/api`） | なし | 本タスクは Hono ルートを新設しない |
| GraphQL / RPC | なし | 該当機能なし |
| D1 テーブル / view | なし | schema 変更なし |
| Cloudflare binding（KV / R2 / Queue / Durable Object） | なし | binding 追加なし |
| 公開 npm script（`package.json` scripts） | あり | `prepare` と `indexes:rebuild` をローカル DevEx contract として追加。外部 API ではないため interfaces 仕様書は N/A |
| 環境変数 / secrets | なし | 既存の `CLOUDFLARE_API_TOKEN` 等を流用 |
| Skill IPC / SDK API | なし | claude-agent-sdk への変更なし |

> `pnpm prepare` / `pnpm indexes:rebuild` は package.json scripts として本タスクで追加済み。外部 API 契約ではなくローカル開発者向け呼び出し口のため、Step 2 の I/F 仕様書追加は N/A とする。

→ **判定**: 新規 I/F の追加なしのため、Step 2 の I/F 仕様書執筆は **N/A**。

## 完了条件

- [x] Step 1-A 完了
- [x] Step 1-B 完了
- [x] Step 1-C 完了
- [x] Step 1-D 完了
- [x] Step 1-E 完了
- [x] Step 1-F 完了
- [x] Step 1-G 完了
- [x] Step 2 N/A 判定の根拠明記
