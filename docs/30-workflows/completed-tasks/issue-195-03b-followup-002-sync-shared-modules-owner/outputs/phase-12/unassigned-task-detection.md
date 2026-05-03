# Unassigned Task Detection

## Detected Items

| ID | 状態 | 内容 | 理由 |
| --- | --- | --- | --- |
| U-ISSUE195-001 | formalized | `sync_jobs` `job_type` enum / `metrics_json` schema 集約 | `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md` |
| U-ISSUE195-002 | resolved_in_cycle | 03a / 03b current spec 文中の「主担当 / サブ担当」drift 確認 | `docs/30-workflows/unassigned-task/task-issue195-owner-coowner-terminology-normalization-001.md` に resolved record として記録。current spec drift は 0 件、historical evidence log は書き換えない |
| U-ISSUE195-003 | no_action | 他の workflow 横断 governance 文書を `_design/` 配下へ集約する要否判定 | 実測で今回の owner 表とは独立。CONST_005 の未タスク化条件を満たさないため起票しない |

## Zero Count Policy

0 件ではない。今回サイクル内で完了できない明確な依存がある formalized 残課題は U-ISSUE195-001 の 1 件のみ。U-ISSUE195-002 は本サイクル内で確認・解決済み、U-ISSUE195-003 は独立スコープのため no_action。
