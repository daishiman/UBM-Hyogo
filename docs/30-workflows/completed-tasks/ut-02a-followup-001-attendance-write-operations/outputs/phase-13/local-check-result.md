# Phase 13 Local Check Result

Phase 13 PR作成は user approval 待ち。

| command | result |
| --- | --- |
| `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | PASS（topic-map / keywords regenerated） |
| artifact output existence check | PASS（all artifact outputs exist） |
| `pnpm --filter @ubm-hyogo/api test attendance` | FAIL in review rerun: Vitest filter expanded to broad API suite; unrelated hook timeouts occurred (12 failed / 679 passed). Not used as final focused evidence. |
| `pnpm --filter @ubm-hyogo/api test -- apps/api/src/repository/attendance.test.ts apps/api/src/routes/admin/attendance.test.ts apps/api/src/routes/admin/meetings.test.ts apps/api/src/repository/__tests__/attendance-provider.test.ts` | PASS in review rerun（script still expanded to API suite: 107 files / 693 tests PASS） |
| `pnpm --filter @ubm-hyogo/api typecheck` | PASS |

Note: Vitest word filters can match the broader API suite in this repo. Use explicit file paths for focused attendance evidence.
