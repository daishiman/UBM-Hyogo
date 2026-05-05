# System Spec Update Summary

今回の実装で正本仕様へ反映した内容:

- attendance POST 成功は 201、重複は 409 + existing row。
- candidates は session 存在確認後に `member_status.is_deleted=1` と既存 attendance 済み member を除外。
- attendance add/remove は actor id/email を session 由来で audit に残す。
- audit action は `attendance.add` / `attendance.remove`。
- DELETE は attendance row 不在を `attendance_not_found` に集約する。
- 07c は API-only / NON_VISUAL とし、ブラウザ screenshot は 08b / 09a に委譲する。

同期先:

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `docs/30-workflows/unassigned-task/task-07c-*`
