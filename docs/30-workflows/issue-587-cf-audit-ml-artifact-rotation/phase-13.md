# Phase 13: PR 作成（implemented_local_runtime_pending / production promotion pending）

## 目的

ユーザー明示許可後にのみ PR を作成する。Issue #587 / #549 は CLOSED 維持で `Refs #549, #587` と連携し、`Closes` / `Fixes` / `Resolves` / open / close 操作は行わない。本サイクルは implemented_local_runtime_pending close-out（rotation scripts / canary workflow / local fixture canary evidence は same-wave、production promotion は Gate-R0〜R3 通過後の別 runtime operation）。

## 前 Phase 依存

- Phase 11（NON_VISUAL 縮約 3 点配置済み + canonical evidence path 予約）
- Phase 12（strict 7 file 配置済み + SSOT 3 ファイル same-wave 同期 spec）

## 自動実行禁止 / 多段ゲート

PR 作成は **ユーザー明示許可後のみ** 実行する。CLAUDE.md の「PR 作成の完全自律フロー」は VISUAL 系の通常実装に適用するもので、本タスク（NON_VISUAL + implemented_local_runtime_pending + CLOSED Issue 参照）では **多段承認ゲートを優先** する。

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| G1 | spec 13 phase + outputs strict 7 file（Phase 12）+ NON_VISUAL evidence files（Phase 11）+ SSOT 3 ファイル same-wave 同期 evidence | ユーザー明示 OK |
| G2 | placeholder token 0 件 / `PASS` 単独表記 0 件 / dirty-code 0 件 / candidate path 実値混入なし | ユーザー明示 OK |
| G3 | commit / push 承認（base=`dev` / branch=`feat/issue-587-cf-audit-ml-artifact-rotation`） | ユーザー明示 OK |
| G4 | PR open 承認 | ユーザー明示 OK |

各 Gate を独立に承認させる。合算承認は禁止。承認前に `gh pr create` 等のコマンドを実行してはならない。

## ブランチ命名

| サイクル | ブランチ | base | 目的 |
| --- | --- | --- | --- |
| 本サイクル（implemented_local_runtime_pending） | `feat/issue-587-cf-audit-ml-artifact-rotation` | `dev` | 13 phase 仕様書 + outputs strict 7 file + rotation scripts + canary workflow + SSOT 同期 |
| Gate 後 implementation cycle | `feat/issue-587-cf-audit-ml-artifact-rotation-impl` | `dev` | rotation scripts / canary workflow / runbook 本体 / SSOT 実反映 |
| Gate 後 promotion cycle | `feat/issue-587-cf-audit-ml-artifact-rotation-promote-vYY` | `dev` | 次世代 model 投入時の op vault 値書き換え record |

## PR 構成（本サイクル: implemented_local_runtime_pending PR）

- **Title**: `docs(cf-audit-log): ML model artifact rotation spec (Refs #549, #587)`
- **Base**: `dev`（CLAUDE.md 既定。`main` ではない）
- **Body**: `.claude/commands/ai/diff-to-pr.md` をテンプレに、`outputs/phase-12/implementation-guide.md` の主要見出しを反映する。

### Body 必須項目

- **Summary**: 本サイクル成果物（13 phase 仕様書 + outputs strict 7 file + SSOT 3 ファイル差分要約 + canonical evidence path 予約）
- **Scope**:
  - In: `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/` 全体 / SSOT 3 ファイル差分要約 / 起票元 unassigned-task との接続
  - Out: rotation scripts 実装（Gate-R0 後） / canary workflow YAML 配置 / runbook 本体 markdown / `..._CANDIDATE` op vault entry 実投入 / 次世代 artifact 投入の実 promotion
- **Refs #549, #587**（`Closes` / `Fixes` / `Resolves` は使わない / Issue は CLOSED 維持）
- **Test plan**:
  - [ ] `mise exec -- pnpm typecheck`（既存 `@sentry/*` 以外 0 件）
  - [ ] `mise exec -- pnpm lint`（既存 `@sentry/*` 以外 0 件）
  - [ ] spec walkthrough（`outputs/phase-11/manual-smoke-log.md` 実体配置）
  - [ ] link-checklist（`outputs/phase-11/link-checklist.md`）で親 #549 / SSOT / `secret-leakage-grep.ts` 参照 OK
  - [ ] strict 7 file 配置確認（短縮名・別名 0 件）
  - [ ] placeholder token 0 件 grep
  - [ ] candidate path 実値混入 0 件 grep
- **Forward-safe rollback**: 本 PR は `git revert`。production promotion の rollback は `op item edit ..._PROD=<previous>` 1 step（D1 列残置）。
- **Migration**: 本 PR では D1 migration apply なし（`classifier_version` 列は親 #515 で apply 済み）。
- **Evidence**: `outputs/phase-11/.gitkeep`（実体は実装サイクル）+ `outputs/phase-12/` strict 7 file 列挙
- **SSOT updates**: SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook） + LOGS 2（aiworkflow-requirements / task-specification-creator）

### スクリーンショット

`visualEvidence: NON_VISUAL` のため **PR body にスクリーンショット項目を作らない**。`outputs/phase-11/` 配下に画像ファイルは存在しないことを `manual-smoke-log.md` で明記済み。

## 禁止事項

- Issue #587 を close する GitHub keyword 記述（CLOSED 維持）
- Issue 状態の自動変更（reopen / close）
- op vault 実エントリ追加 / production artifact promotion を本 PR に含めること
- `--no-verify` 系 hook skip
- base = `main` で PR を出すこと（既定は `dev`）
- ユーザー明示許可前の `gh pr create` 実行
- スクリーンショット用ダミー PNG の生成（NON_VISUAL false-green 防止）
- candidate / PROD / PREVIOUS path の実値の PR diff / commit / log への混入

## 完了条件

- [ ] G1〜G4 各承認をユーザーから取得
- [ ] PR open 後 URL を `outputs/phase-13/main.md` に記録
- [ ] PR body に `Refs #549, #587` 含む（`Closes` を使わない）
- [ ] PR base が `dev`（`main` 以外）
- [ ] PR が production secret / token / candidate artifact 実値を含まない
- [ ] PR diff に `apps/api` / `apps/web` / `scripts/cf-audit-log/rotation/` のコード変更が含まれない（本 PR は docs のみ）
- [ ] PR diff に `.github/workflows/cf-audit-log-artifact-canary.yml` が含まれない（本 PR は spec のみ）
- [ ] PR 本文に `outputs/phase-12/implementation-guide.md` の主要見出し（Part 1 / Part 2 / runtime path × evidence 表 / rollback）が反映されている

## マージ後ハンドリング（completed-tasks 移動）

PR merge 後、本ワークフロー root を以下に移動する（references/completed-tasks-policy.md 準拠）:

- 移動元: `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/`
- 移動先: `docs/30-workflows/completed-tasks/issue-587-cf-audit-ml-artifact-rotation/`

ただし、本サイクルは `implemented_local_runtime_pending` 維持のため、移動時に legacy stub `## Canonical Status` 直下へ以下を **必ず併記**:

> Current canonical state is `implemented_local_runtime_pending`; local canary evidence is captured, but production artifact promotion remains pending Gate-R0〜R3.

`legacy-ordinal-family-register.md` への mapping entry 追加（legacy path / canonical path / 昇格日 / canonical state = `implemented_local_runtime_pending`）も same-wave で実施する。promotion 完走で `pass_runtime_synced` に昇格した時点で本注記は撤去する。

## 出力

- `outputs/phase-13/main.md`（PR URL / 採用ブランチ / 承認 Gate G1〜G4 のタイムスタンプ / 残課題）
  - 本サイクルでは `outputs/phase-13/.gitkeep` のみ配置し、PR 作成時に main.md を生成

## 参照資料

- `index.md`
- `phase-11.md` / `phase-12.md`
- `outputs/phase-12/implementation-guide.md`（PR body 反映元）
- CLAUDE.md `## PR作成の完全自律フロー`（NON_VISUAL では本 Phase の多段承認を優先）
- `.claude/commands/ai/diff-to-pr.md`（PR body テンプレ）
- 親タスク `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md`

## Handoff（→ implementation cycle）

- implementation cycle 開始時:
  - branch: `feat/issue-587-cf-audit-ml-artifact-rotation-impl`（base=`dev`、`bash scripts/new-worktree.sh feat/issue-587-cf-audit-ml-artifact-rotation-impl` で worktree 作成）
  - 取得 evidence: Phase 11 canonical evidence path 7 点（typecheck / lint / test / canary-dry-run / leakage-grep / dataset-grep / build）
  - Gate-R0-1〜R0-5 通過確認後、rotation scripts と canary workflow を実装する別 PR を出す
  - implementation merge 後、staging で canary を 1 回実行し `outputs/phase-11/evidence/canary-dry-run.json` を取得
  - canary 実行 + leakage clean を確認後、`workflow_state` を `implemented_local_evidence_captured` または `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` に昇格
  - promotion cycle は次世代 model 投入時に別途
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
| 13-2 | PR body に `Refs #549, #587` と runtime boundary を明記する |

## 成果物/実行手順

本 Phase はユーザー明示承認まで実行しない。承認後に `outputs/phase-13/main.md` へ PR URL と承認 Gate を記録する。

## Next Phase

- なし（最終 Phase）
