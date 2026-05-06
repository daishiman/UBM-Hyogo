# システム仕様書更新サマリ

## Step 1-A: タスク完了記録

Issue #400 の仕様・実装差分を同一 wave で反映する。Issue は既に CLOSED のため reopen せず、PR 文面は `Refs #400` を使う。

## Step 1-B: 実装状況

| 項目 | 状態 |
| --- | --- |
| workflow | `implemented-local / implementation / NON_VISUAL` |
| Phase 13 | `blocked_pending_user_approval` |
| runtime visual evidence | 不要 |

## Step 1-C: 関連タスク

起票元 `docs/30-workflows/unassigned-task/task-04b-admin-request-audit-target-taxonomy-001.md` は現 worktree に存在しない。Issue #400 と `.claude/skills/aiworkflow-requirements/references/lessons-learned-04b-admin-queue-resolve-2026-05.md` の follow-up 記述を source として扱う。

## Step 2: システム仕様更新

更新対象:

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`

`request resolve audit` の正本は `targetType='admin_member_note'` / `targetId=<noteId>` / `after.memberId` へ更新し、legacy `member` 行は readable として維持する。
