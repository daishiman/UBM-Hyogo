# Phase 13: PR 作成（implemented_local_runtime_pending / D+7 で pass_runtime_synced）

## 目的

ユーザー明示許可後にのみ PR を作成する。Issue #549 / #586 はどちらも CLOSED のまま `Refs #549, Refs #586` で連携し、`Closes` / reopen / close 操作は行わない。本サイクルは workflow YAML 改修 + 7day summary YAML 新規 + SSOT 4 ファイル + Phase 11 local 5 evidence + Phase 12 strict 7 outputs を 1 PR で出し、D+7 で 7day summary workflow が自動起票する evidence PR を別途 merge する 2 段構成。

## 前 Phase 依存

- Phase 11（NON_VISUAL 縮約 3 点配置済 + local 5 evidence 取得済）
- Phase 12（strict 7 file 配置済 + SSOT 4 ファイル same-wave 同期済）

## 自動実行禁止 / 多段ゲート（NON_VISUAL の二重承認）

PR 作成は **ユーザー明示許可後のみ** 実行する。CLAUDE.md の「PR 作成の完全自律フロー」は VISUAL 系の通常実装に適用するもので、本タスク（NON_VISUAL + workflow YAML 改修 + 親 Issue #549 / 自 Issue #586 ともに CLOSED）では **多段承認ゲートを優先** する。

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| G1 | workflow YAML 2 ファイル（編集 + 新規）+ SSOT 4 ファイル + 仕様書 13 phase + Phase 11 local 5 evidence + Phase 12 strict 7 file 揃い | ユーザー明示 OK |
| G2 | placeholder token 0 件 / `PASS` 単独表記 0 件 / dirty-code 0 件 / leakage grep 不要箇所への混入なし / D1 schema diff 0 件 | ユーザー明示 OK |
| G3 | commit / push 承認（base=`dev` / branch=`feat/issue-586-post-switch-7day-close-out`） | ユーザー明示 OK |
| G4 | PR open 承認 | ユーザー明示 OK |
| G5（D+7） | 7day summary workflow 起票の evidence PR の review + SSOT `pass_runtime_synced` 反映 PR | ユーザー明示 OK（D+7） |

各 Gate は独立に承認させる。合算承認は禁止。承認前に `gh pr create` 等のコマンドを実行してはならない。

## ブランチ命名

| サイクル | ブランチ | base | 目的 |
| --- | --- | --- | --- |
| 本サイクル（implemented_local_runtime_pending） | `feat/issue-586-post-switch-7day-close-out` | `dev` | workflow YAML 編集 + 7day summary YAML 新規 + SSOT 4 + 13 phase 仕様書 + outputs |
| D+7 evidence | `chore/issue-586-7day-evidence-<run_id>`（自動）| `dev` | 7day summary workflow が `peter-evans/create-pull-request@v6` で自動起票 |
| D+7 SSOT 昇格 | `feat/issue-586-pass-runtime-synced` | `dev` | SSOT 4 ファイルを `pass_runtime_synced` 文言に書き換え |

## PR 構成（本サイクル）

- **Title**: `feat(cf-audit-log): post-switch 7-day close-out workflow + spec (Refs #549, Refs #586)`
- **Base**: `dev`（CLAUDE.md 既定。`main` ではない）
- **Body**: `.claude/commands/ai/diff-to-pr.md` をテンプレに、`outputs/phase-12/implementation-guide.md` の主要見出しを反映。

### Body 必須項目

- **Summary**: 本サイクル成果物（workflow YAML 編集 / 7day summary YAML 新規 / SSOT 4 ファイル差分要約 / 13 phase 仕様書 + outputs）
- **Scope**:
  - In: `.github/workflows/cf-audit-log-monitor.yml` への hourly post-step 3 種追加 / `.github/workflows/cf-audit-log-7day-summary.yml` 新規 / SSOT 4 ファイル文言更新（`pass_runtime_synced` 状態定義 + canonical evidence path）/ Phase 11 local 5 evidence / Phase 12 strict 7 outputs
  - Out: production env での `gh variable set CF_AUDIT_CLASSIFIER --body "ml"` 実行（PR merge と同タイミングで手動実行）/ 168 hourly 実 run 結果収集（D+7 close-out）/ 90 日 baseline / モデル学習・選定 / artifact フォーマット選定（FU-03-C #548 で確定済）
- **Refs #549, Refs #586**（`Closes` は使わない / どちらの Issue も CLOSED のまま）
- **Test plan**:
  - [ ] `mise exec -- pnpm typecheck`（既存 `@sentry/*` dependency missing 以外の新規エラー 0 件）
  - [ ] `mise exec -- pnpm lint`（同上）
  - [ ] focused Vitest（observation + evaluation）pass
  - [ ] `prettier --check .github/workflows/` pass
  - [ ] `cf-audit-log-7day-summary.yml` workflow_dispatch dry-run の run URL 添付
  - [ ] hourly run 1 回目（merge 直後）で post-step 3 つすべて success の run URL 添付
  - [ ] strict 7 file 配置確認（短縮名・別名 0 件）
  - [ ] D1 schema diff 0 件確認（`git diff dev...HEAD --stat apps/api/migrations/`）
- **Forward-safe rollback**: `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"` 1 step（D1 列残置）+ 必要なら本 PR の revert
- **Migration**: 本 PR では D1 migration apply なし（親 #515 / #549 で apply 済 + 本タスクは forward-safe で touch しない）
- **Evidence**:
  - 本サイクル: `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` + `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md` + `outputs/phase-12/{strict 7}.md`
  - D+7: 7day summary workflow が別 PR で `outputs/phase-11/evidence/{hourly-run-7day.md,hourly-run-7day-summary.json,leakage-grep-7day.log,issue-rate-comparison.md}` を追加
- **SSOT updates**: SSOT 4 ファイル（observability-monitoring / task-workflow-active / 親 #549 phase-13.md / 15-infrastructure-runbook） + LOGS 2（aiworkflow-requirements / task-specification-creator）

### スクリーンショット

`visualEvidence: NON_VISUAL` のため **PR body にスクリーンショット項目を作らない**。`outputs/phase-11/` 配下に画像ファイルは存在しないことを `manual-smoke-log.md` で明記済み。

## 禁止事項

- Issue #549 / #586 への `Closes` 記述（どちらも CLOSED 維持）
- Issue 状態の自動変更（reopen / close）
- 本 PR 内に `gh variable set CF_AUDIT_CLASSIFIER --body "ml"` の自動実行を含めること（手動 1 step）
- D1 schema 変更を本 PR に含めること
- `--no-verify` 系 hook skip
- base = `main` で PR を出すこと（既定は `dev`）
- ユーザー明示許可前の `gh pr create` 実行
- スクリーンショット用ダミー PNG の生成（NON_VISUAL false green 防止）
- production secret / token / model artifact 生値を PR diff / body / log に記載すること

## 完了条件

- [ ] G1〜G4 各承認をユーザーから取得
- [ ] PR open 後 URL を `outputs/phase-13/main.md` に記録
- [ ] PR body に `Refs #549, Refs #586` を含む（`Closes` を使わない）
- [ ] PR base が `dev`（`main` 以外）
- [ ] PR が production secret / token / model artifact 値を含まない
- [ ] PR diff に `apps/api/migrations/` の変更が含まれない（forward-safe）
- [ ] PR diff に新規 TS code が含まれない、または含まれても最小（`expectedSnapshots: 168` 件数検証の追加 5 行以内 + focused test 追加のみ）
- [ ] PR 本文に `outputs/phase-12/implementation-guide.md` の主要見出し（Part 1 / Part 2 / runtime path × evidence 表 / rollback）が反映されている
- [ ] D+7 で 7day summary workflow が起票する evidence PR と SSOT `pass_runtime_synced` 反映 PR の 2 件を別途 merge する手順が `outputs/phase-13/main.md` に明記されている

## マージ後ハンドリング（completed-tasks 移動）

PR merge 後、本ワークフロー root を以下に移動する（references/completed-tasks-policy.md 準拠）:

- 移動元: `docs/30-workflows/issue-586-post-switch-7day-close-out/`
- 移動先: `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/`

ただし、本サイクルは `implemented_local_runtime_pending` 維持のため、移動時に legacy stub `## Canonical Status` 直下へ以下を **必ず併記**:

> Current canonical state is `implemented_local_runtime_pending`; do not treat as completed evidence until D+7 close-out PR merges and `pass_runtime_synced` is achieved.

`legacy-ordinal-family-register.md` への mapping entry 追加（legacy path / canonical path / 昇格日 / canonical state）も same-wave で実施。D+7 で `pass_runtime_synced` 昇格時に本注記を撤去する。

## 出力

- `outputs/phase-13/main.md`（PR URL / 採用ブランチ / 承認 Gate G1〜G5 のタイムスタンプ / D+7 close-out 残課題）

## 参照資料

- `index.md`
- `phase-11.md` / `phase-12.md`
- `outputs/phase-12/implementation-guide.md`（PR body 反映元）
- CLAUDE.md `## PR作成の完全自律フロー`（NON_VISUAL では本 Phase の多段承認を優先）
- `.claude/commands/ai/diff-to-pr.md`（PR body テンプレ）
- 親 `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md`

## Handoff（→ D+7 close-out サイクル）

- D+0（本サイクル merge 直後）:
  - `gh variable set CF_AUDIT_CLASSIFIER --env production --body "ml"` を手動実行
  - hourly run 1 回目で post-step 3 つすべて success を確認
  - artifact `hourly-snapshot-<run_id>` の retention-days 8 を確認
- D+1〜D+6: daily check（任意）で hourly run 24 件単位の success / leakage 0 件確認
- D+7:
  - `gh workflow run cf-audit-log-7day-summary.yml --ref dev` 手動 trigger（または scheduled の自動起動を待つ）
  - 起票された evidence PR を review + merge
  - SSOT 4 ファイルを `pass_runtime_synced` 文言に書き換える別 PR（`feat/issue-586-pass-runtime-synced`）を起票
  - 親 #549 仕様書の legacy stub 注記を撤去
  - `legacy-ordinal-family-register.md` の本タスク entry を `pass_runtime_synced` に更新
- Cloudflare 操作は `bash scripts/cf.sh` 経由のみ（本タスクでは D1 migrations list 確認のみで読み取り専用）

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
| 13-2 | PR body に `Refs #549, Refs #586` と runtime boundary（`pass_runtime_synced` は D+7）を明記する |
| 13-3 | D+7 close-out の手順（evidence PR + SSOT 昇格 PR）を `outputs/phase-13/main.md` に記録する |

## 成果物/実行手順

本 Phase はユーザー明示承認まで実行しない。承認後に `outputs/phase-13/main.md` へ PR URL と承認 Gate を記録。D+7 で close-out 2 件の PR URL を追記する。
