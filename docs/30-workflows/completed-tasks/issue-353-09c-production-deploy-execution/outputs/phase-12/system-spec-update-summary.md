# System Spec Update Summary: 09c-A-production-deploy-execution

判定行: `SYNCED_RUNTIME_PENDING`

## Step 1-A: タスク完了記録

| 対象 | 結果 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/` を current canonical root として同期 |
| aiworkflow quick-reference | production execution path を `completed-tasks/09c-A-production-deploy-execution/` に補正 |
| aiworkflow resource-map | current workflow row を現存 path / `VISUAL_ON_EXECUTION` / strict outputs present に補正 |
| aiworkflow task-workflow-active | active row を現存 path / current state に補正 |
| artifact inventory | Current workflow root と verification command を現存 path に補正 |
| source unassigned task | Canonical workflow と deploy command を現行 `scripts/cf.sh` route に補正 |
| deployment-cloudflare-opennext-workers | 09c-A production execution workflow 導線、`VISUAL_ON_EXECUTION` 境界、`cf.sh` 正本 deploy route、`ubm-hyogo-db-prod` を追記 |

## Step 1-B: 実装状況テーブル更新

| 項目 | 値 |
| --- | --- |
| workflow_state | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| runtime evidence | `PENDING_RUNTIME_EVIDENCE` |
| Phase 12 strict outputs | present |

`spec_created` は維持する。production D1 migration / deploy / release tag / PR 作成は user approval 後の execution operation でのみ実行する。

## Step 1-C: 関連タスクテーブル更新

| 関連 | 取扱 |
| --- | --- |
| 09a staging smoke | upstream gate。green evidence なしに production mutation へ進まない |
| 09b release/incident runbook | upstream gate。incident handoff の参照元 |
| 09b-A observability | upstream gate。`observability-sentry.md` / `observability-slack.md` に provider smoke green citation が必要 |
| UT-29 / 09b-B post-deploy healthcheck | upstream blocker。`post-deploy-healthcheck.md` に silent failure 検知 mechanism green citation が必要。未 green の場合 09c-A Phase 11 は開始しない |
| 09c serial runbook | parent docs-only source。execution PASS ではない |
| `task-09c-production-deploy-execution-001.md` | consumed pointer。canonical root は `completed-tasks/09c-A-production-deploy-execution/` |

## Step 1-H: Skill Feedback Routing

| item | routing | evidence |
| --- | --- | --- |
| Phase 12 strict 7 files 欠落 | fixed in workflow files | `outputs/phase-12/*.md` |
| canonical path drift | fixed in aiworkflow references/indexes | quick-reference / resource-map / task-workflow-active |
| docs-only wording in implementation workflow | fixed in phase metadata | `phase-04.md` ... `phase-10.md` |
| stale deploy command | fixed in source unassigned task | `task-09c-production-deploy-execution-001.md` |
| Phase 9 evidence が Phase 11 manifest に未接続 | fixed in workflow files | `preflight-*` / `redaction-check.md` / `observability-*` / `post-deploy-healthcheck.md` |

## Step 1-I: Infrastructure Runbook Sync

`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に次を反映した。

- Issue #353 mirror の production deploy execution 状態: `spec_created / implementation / VISUAL_ON_EXECUTION / runtime pending`
- Canonical production commands: D1 apply、API deploy、Web build、Web deploy、release tag
- Approval gate separation: spec PR / G-1 dev→main promotion / G-2〜G-5 production mutation / G-R rollback
- 24h verification timing: T+0 / T+1h / T+6h / T+24h
- Free-tier warning thresholds: Workers requests 50k+、D1 reads 500k+、D1 writes 10k+
- 09b-A observability と UT-29 / 09b-B post-deploy healthcheck を upstream blocker とする境界

## Step 2: 新規インターフェース追加時のみ

判定: `N/A`

理由:

- 本タスクは production deploy execution の runbook / evidence contract を仕様化するもので、TypeScript interface / API endpoint / shared package 型の新規追加はない。
- 実行コマンドは既存 `scripts/cf.sh` と既存 `wrangler.toml` を使う。
- runtime facts は Phase 11 execution operation 後に同一 evidence path へ上書きするため、本 Phase 12 で仕様正本を runtime PASS に昇格しない。
