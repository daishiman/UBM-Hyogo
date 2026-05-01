# unassigned-task-detection

09b で扱わずに別 task / 別 wave に切り出した未割当作業を列挙する。

## 未割当 task

| # | 課題 | 取り扱い | 担当 / 候補 task | 優先度 | 備考 |
| --- | --- | --- | --- | --- | --- |
| 1 | Sentry 本接続 + DSN 登録 | formalized | `docs/30-workflows/unassigned-task/task-obs-sentry-dsn-registration-001.md` | 中 | 09b では `<placeholder>` 表記のみ。実 DSN は Cloudflare Secrets に登録 |
| 2 | Logpush sink 設定 | candidate / no formalize | UT-OBS-LOGPUSH-001（candidate） | 低 | 一部有料、無料枠と相談。当面 Cloudflare Analytics のみ。09b の成功条件に不要で、plan / sink 契約判断が未確定のため formalize しない |
| 3 | Slack bot 通知 (incident escalation) | formalized | `docs/30-workflows/unassigned-task/task-obs-slack-notify-001.md` | 中 | manual 通知から自動化したい。Slack workflow + webhook |
| 4 | postmortem の自動テンプレ生成 | existing related / no formalize | `docs/30-workflows/unassigned-task/task-09c-postmortem-template-automation-001.md` | 低 | sync_jobs.failed 連続 → GitHub Issue 自動作成案。09c 側の既存 task と重複するため新規 formalize しない |
| 5 | legacy `0 * * * *` cron の撤回 | 委譲済み | UT21-U05 (`task-ut21-impl-path-boundary-realignment-001`) | 中 | 09b で UT21-U05 へ委譲することを runbook-diff-plan に明記 |
| 6 | Cloudflare Analytics URL の自動 verify | 委譲済み | UT-05A-CF-ANALYTICS-AUTO-CHECK-001 | 低 | 05a で placeholder 配置済み、URL 整合性自動チェックは別 task |
| 7 | sync_jobs running guard の partial unique index 追加 | formalized | `docs/30-workflows/unassigned-task/task-db-syncjobs-unique-001.md` | 中 | 03b 完了後の検討事項。SQLite/D1 partial index 対応確認込み |
| 8 | cron 一時停止を GitHub Actions workflow 化 | candidate / no formalize | UT-OPS-CRON-PAUSE-WORKFLOW-001（candidate） | 低 | runbook の手作業削減。権限設計と audit owner が未確定のため、09b では candidate 記録に留める |
| 9 | release runbook を sh script 化 | candidate / no formalize | UT-OPS-RELEASE-SCRIPT-001（candidate） | 低 | docs-only scope を超えるため、09b では markdown runbook を正本にする |
| 10 | rollback の rollback（rollforward）テスト自動化 | candidate / no formalize | UT-OPS-ROLLFORWARD-TEST-001（candidate） | 低 | staging 限定 chaos test は 09c 実運用後に必要性を再判定する |

## 既存 task との重複確認

- 上記 5, 6 は既に別 task に割当済み
- 1, 3, 7 は本レビューで中優先度 follow-up として `docs/30-workflows/unassigned-task/` に formalize 済み
- 2, 8, 9, 10 は低優先度 candidate として残す。09b の Phase 12 では scope / 費用 / 権限が未確定のため formalize しない
- 4 は既存 `task-09c-postmortem-template-automation-001.md` に重複するため新規 formalize しない

## 優先度判断

- 中: 運用上必要だが当面手動運用で対応可（1, 3, 5, 7）
- 低: あれば便利、無くても運用は回る（2, 4, 6, 8, 9, 10）
- 高: 09b の goal（release/incident runbook 完成 + 09c 引き渡し）に達したため、現時点で「高」候補なし

## 不変条件への影響

- 1〜4 のいずれも runtime 接続を伴うが、09b 完了の time-frame では未接続でも不変条件 #5/#6/#10/#15 は担保されている（runbook の placeholder 表記で運用可能）

## 次アクション

- 本ファイルを Phase 13 PR の change-summary に link
- ユーザー承認後、必要に応じて GitHub Issue / 別 task spec を作成
