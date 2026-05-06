# Documentation Changelog

| File | Change |
| --- | --- |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/docs/30-workflows/issue-401-admin-request-notification/index.md` | env 正本、PII ledger 方針、CLOSED Issue 参照方式を補正 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/docs/30-workflows/issue-401-admin-request-notification/phase-02.md` | retry state machine、recipient lookup、cron 統合、env 正本を補正 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/docs/30-workflows/issue-401-admin-request-notification/phase-05.md` | pending 復帰 retry と recipient lookup を補正 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/docs/30-workflows/issue-401-admin-request-notification/phase-06.md` | `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` と `*/5` cron 統合を補正 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/docs/30-workflows/issue-401-admin-request-notification/phase-07.md` | AC-11 と retry pending 復帰を追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/docs/30-workflows/issue-401-admin-request-notification/phase-10.md` | secret hygiene を `MAIL_PROVIDER_KEY` に補正 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/docs/30-workflows/issue-401-admin-request-notification/phase-11.md` | secret evidence を `MAIL_PROVIDER_KEY` に補正 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/docs/00-getting-started-manual/specs/07-edit-delete.md` | notification outbox 契約を追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/.claude/skills/aiworkflow-requirements/SKILL.md` | changelog entry 追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | usage log entry 追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Issue #401 状態・mail config gate・runtime boundary を補正 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | planned files 表記を implemented-local 実装ファイルへ補正 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | `spec_created/not_started` drift を `implemented-local/runtime pending` に補正 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | lease recovery / sanitized provider error / claim-before-config gate を追記 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | raw `resolutionNote` を `reason_summary` にコピーしない境界を追記 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/apps/api/migrations/0014_notification_outbox.sql` | status/outcome/request/event CHECK 制約を追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/apps/api/src/repository/notificationOutbox.ts` | enqueue batch atomicity、stale dispatching reclaim を追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/apps/api/src/services/notification/dispatcher.ts` | provider error body を error class に縮約 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/apps/api/src/workflows/notificationDispatchTick.ts` | dispatching ledger event、dispatcher throw handling、claim lease を追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/apps/api/src/index.ts` | mail config readiness gate を claim 前に追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/apps/api/src/notification-mail-config.test.ts` | mail config readiness focused test を追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/apps/api/src/routes/admin/requests.test.ts` | reject `resolutionNote` 非コピー test を追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/apps/api/src/repository/__tests__/notificationOutbox.test.ts` | stale dispatching reclaim test を追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/apps/api/src/services/notification/__tests__/dispatcher.test.ts` | provider error redaction test を追加 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260506-074446-wt-5/apps/api/src/workflows/notificationDispatchTick.test.ts` | dispatching ledger / throw recovery test を追加 |
