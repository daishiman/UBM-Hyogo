# Artifact Inventory: ut-02a-followup-001-attendance-write-operations

## Metadata

| Field | Value |
| --- | --- |
| Workflow | `docs/30-workflows/completed-tasks/ut-02a-followup-001-attendance-write-operations/` |
| Source unassigned | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/task-ut-02a-attendance-write-operations-001.md` |
| Parent workflow | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/` |
| Resolution | `resolved-by-existing-06cE-07c` |
| State | `implemented-local / implementation / NON_VISUAL / Phase 12 strict 7 files present / Phase 13 pending_user_approval` |
| Sync date | 2026-05-06 |
| Issue | UT-02A Phase 12 起票元（`Refs` 非採用 / Issue 番号無し） |

## Classification（責務分離）

| Layer | Responsibility | Path |
| --- | --- | --- |
| spec / workflow root | 13-phase close-out 仕様の正本 | `docs/30-workflows/completed-tasks/ut-02a-followup-001-attendance-write-operations/` |
| repository (existing) | attendance write 正本（`addAttendance` / `removeAttendance`） | `apps/api/src/repository/attendance.ts` |
| route (existing, touched) | canonical / legacy attendance route + audit log 結線 | `apps/api/src/routes/admin/attendance.ts` |
| route tests (touched) | error mapping + audit log 検証 | `apps/api/src/routes/admin/attendance.test.ts`, `apps/api/src/routes/admin/meetings.test.ts` |
| skill artifacts | closeout / lessons / inventory / LOGS | `.claude/skills/aiworkflow-requirements/changelog/`, `.claude/skills/aiworkflow-requirements/references/`, `.claude/skills/aiworkflow-requirements/LOGS/` |
| source unassigned stub | 起票元（解消記録を追記） | 上記 source unassigned path |

## Phase 12 outputs（strict 7 files）

| artifact | path | purpose |
| --- | --- | --- |
| phase 12 main | `outputs/phase-12/main.md` | Phase 12 overview / DoD / strict 7 files index |
| implementation guide | `outputs/phase-12/implementation-guide.md` | Part1 中学生レベル + Part2 技術者レベル / route contract / error mapping |
| system spec update summary | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements index / changelog 同期実績 |
| documentation changelog | `outputs/phase-12/documentation-changelog.md` | 本 close-out で更新したドキュメント一覧 |
| unassigned task detection | `outputs/phase-12/unassigned-task-detection.md` | source unassigned task 解消記録の反映表 |
| skill feedback report | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements feedback |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | CONST_001〜007 適合確認 |

## Implementation artifacts

| layer | path | role |
| --- | --- | --- |
| repository | `apps/api/src/repository/attendance.ts` | `addAttendance` / `removeAttendance` 正本（`MeetingSessionId` cast helper、duplicate / deleted_member / not_found reason 返却） |
| route | `apps/api/src/routes/admin/attendance.ts` | canonical PUT/DELETE `/api/admin/meetings/:id/attendees/:memberId` + legacy POST/DELETE `/api/admin/meetings/:id/attendance` の両系統。error mapping と audit log 結線 |
| route tests | `apps/api/src/routes/admin/attendance.test.ts` | duplicate=409 / deleted_member=422 / session_not_found=404 / attendance_not_found=404 / audit log emission |
| route tests (sibling) | `apps/api/src/routes/admin/meetings.test.ts` | meetings ↔ attendance 境界の regression 確認 |

## Route contract

| family | method | path | success | notes |
| --- | --- | --- | --- | --- |
| canonical | PUT | `/api/admin/meetings/:id/attendees/:memberId` | `{ ok: true, attended: true }` | UI toggle 軽量 contract（add） |
| canonical | DELETE | `/api/admin/meetings/:id/attendees/:memberId` | `{ ok: true, attended: false }` | UI toggle 軽量 contract（remove）|
| legacy | POST | `/api/admin/meetings/:id/attendance` | `{ ok: true, attendance: {...} }` | row 詳細を返す旧 add contract |
| legacy | DELETE | `/api/admin/meetings/:id/attendance/:memberId` | `{ ok: true }` | 旧 remove contract（冪等性は repository-only） |

## Error mapping

| repository reason | HTTP | error code |
| --- | --- | --- |
| `duplicate` | 409 | `attendance_already_recorded` |
| `deleted_member` | 422 | `member_is_deleted` |
| `session_not_found` | 404 | `session_not_found` |
| `member_not_found` | 404 | `member_not_found`（legacy route で正規化） |
| `attendance_not_found` | 404 | `attendance_not_found`（remove で対象 row 不在時） |

## Audit log emission

| operation | audit action | trigger |
| --- | --- | --- |
| add (canonical / legacy) | `attendance.add` | 成功時のみ。duplicate / deleted_member / not_found では emission しない |
| remove (canonical / legacy) | `attendance.remove` | 成功時のみ。冪等 remove で row 不在時は 404 を返し emission しない |

## Skill artifacts

| artifact | path | purpose |
| --- | --- | --- |
| closeout changelog | `.claude/skills/aiworkflow-requirements/changelog/20260506-ut-02a-attendance-write-operations-closeout.md` | wave close-out summary |
| lessons learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-ut-02a-attendance-write-operations-2026-05.md` | L-UT02A-WRITE-001〜005 |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-ut-02a-followup-001-attendance-write-operations-artifact-inventory.md` | 本 file |
| LOGS | `.claude/skills/aiworkflow-requirements/LOGS/20260506-ut-02a-attendance-write-operations-closeout.md` | LOGS フォーマット同期エントリ |

## Validation chain

| command | purpose |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | 型契約保証 |
| `mise exec -- pnpm --filter @ubm-hyogo/api test -- routes/admin/attendance.test.ts` | route + audit log + error mapping |
| `mise exec -- pnpm --filter @ubm-hyogo/api test -- routes/admin/meetings.test.ts` | meetings / attendance 境界 regression |
| `mise exec -- pnpm lint` | lint gate |
| `mise exec -- pnpm indexes:rebuild` | indexes 再生成（drift 検出） |

## 運用メモ

- 新規 `AttendanceWriter` 抽象 / `AttendanceRecordId` branded type は導入しない（過剰抽象）。
- Phase 11 curl / UI smoke は `CONTRACT_ONLY_NOT_EXECUTED`。runtime evidence は 08b / 09a へ委譲する。
- source unassigned task と親 `unassigned-task-detection.md` の双方に解消記録を追記し、close-out workflow root へ片方向誘導する。
- 06c-E（admin meetings follow-up）/ 07c（audit log browsing UI）の既存実装が AC を全充足するため、本 follow-up は新規実装ではなく resolved-by-existing close-out として処理する。
