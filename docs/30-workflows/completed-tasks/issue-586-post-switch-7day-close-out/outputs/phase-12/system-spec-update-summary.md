# System Spec Update Summary

## Step 1-A 完了タスク記録

| 同期先 | 追記 |
| --- | --- |
| `docs/30-workflows/issue-586-post-switch-7day-close-out/index.md` | `phases[1-13].status = spec_created` を維持 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Issue #586 close-out review sync を same-wave 追記済み |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | N日 close-out / cross-run artifact aggregation skill feedback を same-wave 追記済み |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | N日 close-out evidence matrix / skeleton metrics gate / cross-run `gh api` pattern を same-wave 追記済み |
| `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | Phase 12 の N日 close-out sync 必須項目を same-wave 追記済み |

## Step 1-B 実装状況

`workflow_state` の 3 段昇格を `index.md` Decision Log に記録:

- merge 前 = `implemented_local_runtime_pending`
- merge 後 = `pass_boundary_synced_runtime_pending`
- D+7 = `pass_runtime_synced`

Issue #586 / #549 は CLOSED のまま reopen せず `Refs #549, Refs #586` で連携。

## Step 1-C 関連タスクテーブル

| 関連タスク | 更新後 status |
| --- | --- |
| 親 #549 | 本タスク D+7 完走で `pass_runtime_synced` に昇格 |
| 親 #515 | `completed` 維持 |
| FU-03-A 90 日 baseline | `unassigned` 維持 |
| FU-03-C #548 | `completed` 維持 |
| 本タスク #586 | `implemented_local_runtime_pending` |

## Step 1-D 上流 runbook 差分タイミング

`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` への追記は same-wave で実施済み（本 PR）。D+7 で `pass_runtime_synced` セクションを再 commit する別 PR を出す。

## Step 1-H skill feedback routing

詳細は `skill-feedback-report.md` を参照。

## Step 2 新規インターフェース追加

`SevenDaySummary` 型を 7day summary workflow の正本 schema として追加（`implementation-guide.md` Part 2）。同期先:

| 同期先 | 追記内容 |
| --- | --- |
| `observability-monitoring.md` §11.1 | `pass_runtime_synced` 状態定義 + canonical evidence path + 4 観測軸 threshold |
| `task-workflow-active.md` Issue #549 entry | 3 段昇格手順 |
| `issue-549/.../phase-13.md` | 2026-05-09 update 注記（D+7 で legacy stub 撤去） |
| `15-infrastructure-runbook.md` | Issue #586 close-out section |
| `phase-template-phase11.md` / `phase-12-documentation-guide.md` | cross-run aggregation / durable snapshot count / skeleton metrics gate の skill feedback |

## artifacts.json parity 文言（逐語コピー必須）

> root `artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。root が編集正本、outputs 側は Phase evidence mirror として同値維持する。
