# System Spec Update Summary

## Updated Contracts

| Area | Change |
| --- | --- |
| tag assignment queue | retry tick 対象条件を human review queue と分離 |
| audit | `admin.tag.queue_dlq_moved` を DLQ 移送監査 action として固定し、`target_type='tag_queue'` に既存 resolve/reject 監査と統一 |
| cron | `*/5 * * * *` retry tick を追加し、各 env の cron を3本以内に維持 |
| aiworkflow indexes | issue-377 workflow を resource-map / quick-reference / task-workflow-active / artifact inventory / changelog / LOGS に登録 |
| source backlog | `task-issue-109-retry-tick-and-dlq-audit-001.md` を `consumed_by_issue_377` に更新 |
| issue state | Issue #377 は CLOSED のため `Refs #377` のみ。再オープン/再クローズしない |

## Runtime Boundary

Local code and focused tests are complete. Deploy, Cloudflare tail, production audit observation, commit, push, and PR remain user-gated.
