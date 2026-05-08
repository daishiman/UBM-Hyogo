# 2026-05-08 Issue #533 Public Profile Attendance

Issue #533 public profile builder attendance injection を `verified / implementation / NON_VISUAL / implementation_complete_pending_pr` として同期した。

## 正本化内容

- `PublicMemberProfile.attendance: AttendanceRecord[]` と optional `attendanceMeta` を public API contract に追加。
- `GET /public/members/:memberId` は `attendanceProviderMiddleware` / `RepositoryProviderVariables` 経由で attendance provider を bind する。
- attendance read は公開適格判定後に実行し、非公開 member の attendance 有無を 404 経路で漏らさない。
- public response は `responseEmail`, `audit`, `adminNotes`, member-only/admin-only field を含めない。
- Issue #533 は CLOSED 維持。PR 文脈は `Refs #533` のみ。

## 同期ファイル

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-533-public-profile-builder-attendance-injection-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
- `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/outputs/phase-12/*`
