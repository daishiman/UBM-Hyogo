# Phase 13: PR 作成（implemented-local / runtime switch pending）

## 目的

ユーザー明示許可後にのみ PR を作成する。Issue #549 は CLOSED のまま `Refs #549` で連携し、`Closes` / reopen / close 操作は行わない。本サイクルは local observation scripts + docs/SSOT のため、feature ブランチで base=`dev` の PR を出す。production env switch / model artifact 配布 / hourly workflow post-step 組み込みは Gate-0〜C 通過後の別 runtime cycle とする。

## 前 Phase 依存

- Phase 11（NON_VISUAL 縮約 3 点配置済み）
- Phase 12（strict 7 file 配置済み + SSOT 3 ファイル same-wave 同期済み）

## 自動実行禁止 / 多段ゲート（NON_VISUAL の二重承認）

PR 作成は **ユーザー明示許可後のみ** 実行する。CLAUDE.md の「PR 作成の完全自律フロー」は VISUAL 系の通常実装に適用するもので、本タスク（NON_VISUAL + implemented-local + 親 Issue CLOSED）では **多段承認ゲートを優先** する。

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| G1 | local scripts + spec 7 file（Phase 12）+ NON_VISUAL evidence files（Phase 11）+ SSOT 3 ファイル same-wave 同期 evidence | ユーザー明示 OK |
| G2 | placeholder token 0 件 / `PASS` 単独表記 0 件 / dirty-code 0 件 / leakage grep 不要箇所への混入なし | ユーザー明示 OK |
| G3 | commit / push 承認（base=`dev` / branch=`feat/issue-549-cf-audit-ml-production-switch`） | ユーザー明示 OK |
| G4 | PR open 承認 | ユーザー明示 OK |

各 Gate を独立に承認させる。合算承認は禁止。承認前に `gh pr create` 等のコマンドを実行してはならない。

## ブランチ命名

| サイクル | ブランチ | base | 目的 |
| --- | --- | --- | --- |
| 本サイクル（implemented-local） | `feat/issue-549-cf-audit-ml-production-switch` | `dev` | observation scripts / fallback alert / leakage grep CLI + 仕様書 13 phase + outputs 7+ file |
| Gate 後 runtime cycle | `feat/issue-549-cf-audit-ml-production-runtime-switch` | `dev` | workflow YAML / production env switch / model artifact / hourly post-step / 7 日観測 |

## PR 構成（本サイクル: implemented-local PR）

- **Title**: `docs(cf-audit-log): production ML switch + 7-day observation spec (Refs #549)`
- **Base**: `dev`（CLAUDE.md 既定。`main` ではない）
- **Body**: `.claude/commands/ai/diff-to-pr.md` をテンプレに、`outputs/phase-12/implementation-guide.md` の主要見出しを反映する。

### Body 必須項目

- **Summary**: 本サイクル成果物（local observation scripts + fallback alert + leakage grep CLI + 13 phase 仕様書 + outputs + SSOT 3 ファイル差分要約）
- **Scope**:
  - In: `.github/workflows/cf-audit-log-monitor.yml` の env 切替 PR diff 案 / observation script 仕様 / fallback alert 仕様 / leakage grep post-step 仕様 / rollback runbook / 7 日観測 telemetry / SSOT 同期
  - Out: production env 実切替（Gate-0〜C 通過後） / workflow hourly post-step 組み込み / model artifact 本番配布 / 90 日 baseline / モデル学習・選定 / artifact フォーマット選定（FU-03-C #548 で確定）
- **Refs #549**（`Closes` は使わない / Issue は CLOSED のまま）
- **Test plan**:
  - [ ] `mise exec -- pnpm typecheck`（既存 `@sentry/*` dependency missing 以外の新規エラー 0 件）
  - [ ] `mise exec -- pnpm lint`（既存 `@sentry/*` dependency missing 以外の新規エラー 0 件）
  - [ ] focused Vitest（observation + leakage grep）pass
  - [ ] spec walkthrough（`outputs/phase-11/manual-smoke-log.md` 実体配置）
  - [ ] link-checklist（`outputs/phase-11/link-checklist.md`）で親 #515 / SSOT / `.github/workflows/cf-audit-log-monitor.yml` 参照 OK
  - [ ] strict 7 file 配置確認（短縮名・別名 0 件）
- **Forward-safe rollback**: 本 implemented-local PR は `git revert`。runtime switch PR の rollback は `gh variable set CF_AUDIT_CLASSIFIER --body "threshold"` 1 step（D1 列残置）。
- **Migration**: 本 PR では D1 migration apply なし（親 #515 で staging apply 済み）。production apply は実装サイクルで Gate-A〜C 通過後。
- **Evidence**: `outputs/phase-11/` および `outputs/phase-12/` の path 列挙。production runtime evidence は Gate 後 runtime cycle で取得する旨を明記。
- **SSOT updates**: SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook） + LOGS 2（aiworkflow-requirements / task-specification-creator）

### スクリーンショット

`visualEvidence: NON_VISUAL` のため **PR body にスクリーンショット項目を作らない**。`outputs/phase-11/` 配下に画像ファイルは存在しないことを `manual-smoke-log.md` で明記済み。

## 禁止事項

- Issue #549 の `Closes #549` 記述（CLOSED 維持）
- Issue 状態の自動変更（reopen / close）
- production env 実切替（`CF_AUDIT_CLASSIFIER=ml`）/ production migration apply / model artifact 本番配布 を本 implemented-local PR に含めること
- `--no-verify` 系 hook skip
- base = `main` で PR を出すこと（既定は `dev`）
- ユーザー明示許可前の `gh pr create` 実行
- スクリーンショット用ダミー PNG の生成（NON_VISUAL false green 防止）

## 完了条件

- [ ] G1〜G4 各承認をユーザーから取得
- [ ] PR open 後 URL を `outputs/phase-13/main.md` に記録
- [ ] PR body に `Refs #549` 含む（`Closes` を使わない）
- [ ] PR base が `dev`（`main` 以外）
- [ ] PR が production secret / token / model artifact 値を含まない
- [ ] PR diff に `apps/api` / `apps/web` / `scripts/cf-audit-log/observation/` のコード変更が含まれない（本 PR は docs のみ）
- [ ] PR 本文に `outputs/phase-12/implementation-guide.md` の主要見出し（Part 1 / Part 2 / runtime path × evidence 表 / rollback）が反映されている

## マージ後ハンドリング（completed-tasks 移動）

PR merge 後、本ワークフロー root を以下に移動する（references/completed-tasks-policy.md 準拠）:

- 移動元: `docs/30-workflows/issue-549-cf-audit-ml-production-switch/`
- 移動先: `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/`

ただし、本サイクルは `spec_created` 維持のため、移動時に legacy stub `## Canonical Status` 直下へ以下を **必ず併記**:

> Current canonical state is `spec_created`; do not treat as completed evidence.

`legacy-ordinal-family-register.md` への mapping entry 追加（legacy path / canonical path / 昇格日 / canonical state = `spec_created`）も same-wave で実施する。実装サイクル完走 + 7 日観測完走で `pass_runtime_synced` に昇格した時点で本注記は撤去する。

> **2026-05-09 update（Refs #586）**: Issue #586 close-out で workflow YAML 改修 + `cf-audit-log-7day-summary.yml` 新規 + SSOT 4 ファイル更新を実施した。本サイクル merge 直後の状態は `pass_boundary_synced_runtime_pending` に昇格し、D+7 で 168 hourly snapshots 集約 + leakage grep 7 日連続 clean + fallback rate mean ≤ 5% を満たした時点で `pass_runtime_synced` に昇格させる。本 stub の撤去は D+7 完走後の close-out PR で行う。

## 出力

- `outputs/phase-13/main.md`（PR URL / 採用ブランチ / 承認 Gate G1〜G4 のタイムスタンプ / 残課題）

## 参照資料

- `index.md`
- `phase-11.md` / `phase-12.md`
- `outputs/phase-12/implementation-guide.md`（PR body 反映元）
- CLAUDE.md `## PR作成の完全自律フロー`（NON_VISUAL では本 Phase の多段承認を優先）
- `.claude/commands/ai/diff-to-pr.md`（PR body テンプレ）
- 親タスク `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/phase-13.md`

## Handoff（→ 実装サイクル）

- 実装サイクル開始時:
  - branch: `feat/issue-549-cf-audit-ml-production-switch`（base=`dev`、`bash scripts/new-worktree.sh feat/issue-549-cf-audit-ml-production-switch` で worktree 作成）
  - 取得 evidence: Phase 11 canonical evidence path 5 点（typecheck / lint / test / build / grep-gate）+ dry-run ml log + staging migration list
  - Gate-A〜C 通過確認後、workflow YAML の env を `threshold` → `ml` に変更する別 PR を出す
  - production env 切替 merge 後、7 日 hourly observation を取得し `outputs/phase-11/evidence/hourly-run-7day.md` に追記
  - 7 日完走後の close-out で `workflow_state` を `pass_runtime_synced` に昇格 + legacy stub 注記撤去
- Cloudflare 操作は `bash scripts/cf.sh` 経由のみ（`wrangler` 直接実行禁止）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | blocked_pending_user_approval |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 13-1 | ユーザー承認後に commit / push / PR を作成する |
| 13-2 | PR body に `Refs #549` と runtime boundary を明記する |

## 成果物/実行手順

本 Phase はユーザー明示承認まで実行しない。承認後に `outputs/phase-13/main.md` へ PR URL と承認 Gate を記録する。
