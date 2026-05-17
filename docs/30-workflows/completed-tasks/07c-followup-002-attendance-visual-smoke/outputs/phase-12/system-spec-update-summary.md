# Phase 12: system-spec-update-summary

[実装区分: 実装仕様書]

## System spec impact

| Target | Impact | Result |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/**` | No API / DB / auth contract change | No edit |
| `apps/web/playwright/tests/attendance.spec.ts` | AC-1〜AC-4 visual smoke implemented | Same wave implementation |
| `apps/web/playwright/page-objects/AdminMeetingsPage.ts` | Attendance list/detail helpers added | Same wave implementation |
| `apps/web/playwright/fixtures/auth.ts` | Standalone mock meetings endpoints added | Same wave implementation |
| `apps/web/playwright/fixtures/admin-meetings.ts` | Attendance seed SSOT added | Same wave implementation |
| `apps/web/src/components/admin/MeetingPanel.tsx` | Stable test ids added only | Same wave implementation |
| `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` | Existing `/attendances` POST surface aligned | Same wave implementation |
| `apps/api/src/routes/admin/meetings.ts` | `GET /admin/meetings/:id` detail read route added because Web detail page already depended on it | Same wave implementation |
| `apps/api/src/routes/admin/meetings.contract.spec.ts` | Detail route 200 / 404 contract added | Same wave implementation |
| `.github/workflows/playwright-smoke.yml` | Focused attendance visual smoke step added under existing smoke job | Same wave implementation |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | New workflow lookup added | Same wave sync |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | New resource row added | Same wave sync |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Active workflow row added | Same wave sync |
| `.claude/skills/aiworkflow-requirements/references/workflow-07c-followup-002-attendance-visual-smoke-artifact-inventory.md` | Artifact inventory added | Same wave sync |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | Sync entry added | Same wave sync |

## Step 2

**判定: N/A**

- D1 schema / Auth.js contract の新規追加なし。
- Admin API は既存仕様・Web detail page 依存に合わせて `GET /admin/meetings/:id` detail read route を追加。
- Attendance mutation は既存 `POST /admin/meetings/:id/attendances` with `{ attended: true | false }` に統一。
- 本タスクの system spec 影響は workflow / testing evidence と admin meetings detail read contract の同期で閉じる。

## Conclusion

正本仕様に既存 admin meetings detail read contract を明示し、aiworkflow-requirements の索引・active workflow・artifact inventory も同一 wave で更新する。
