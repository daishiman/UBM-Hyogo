## Summary

- Added and hardened admin component unit tests for MembersClient, TagQueuePanel, AdminSidebar, SchemaDiffPanel, MemberDrawer, MeetingPanel, and AuditLogPanel.
- Kept production code unchanged; test fixtures and mocks stay local to each component test because a shared admin test helper would add unnecessary abstraction for this scope.
- NON_VISUAL task: screenshot evidence is not required. Runtime evidence is `test:coverage` plus the target coverage extract.

## Coverage Improvement

| File | Before (Lines / Branches) | After (Lines / Branches) |
| --- | --- | --- |
| MembersClient.tsx | 0 / 0 | 100 / 100 |
| TagQueuePanel.tsx | 0 / 0 | 100 / 96.15 |
| AdminSidebar.tsx | 0 / 0 | 100 / 100 |
| SchemaDiffPanel.tsx | 58.62 / 38.46 | 100 / 95.65 |
| MemberDrawer.tsx | 63.68 / 50 | 96.64 / 84.61 |
| MeetingPanel.tsx | 66.44 / 33.33 | 98.02 / 84.44 |
| AuditLogPanel.tsx | 98.5 / 74.19 | 100 / 98.73 |

## Evidence

- Vitest coverage log: `docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/vitest-run.log`
- Coverage snapshot: `docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/coverage-summary.snapshot.json`
- Target file extract: `docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/coverage-target-files.txt`

## Test Plan

- [x] `pnpm --filter @ubm-hyogo/web test -- apps/web/src/components/admin/__tests__/TagQueuePanel.test.tsx` (21 files / 196 tests PASS)
- [x] `pnpm --filter @ubm-hyogo/web test:coverage` (21 files / 196 tests PASS; target 7 files all threshold PASS)
- [ ] CI all jobs green
