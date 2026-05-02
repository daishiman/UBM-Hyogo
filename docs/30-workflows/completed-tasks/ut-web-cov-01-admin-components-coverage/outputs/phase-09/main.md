# outputs phase 09: ut-web-cov-01-admin-components-coverage

- status: completed
- purpose: 品質保証
- verification command: `pnpm --filter @ubm-hyogo/web test:coverage`
- result: PASS (21 test files / 196 tests)
- target coverage:
  - `MembersClient.tsx`: PASS 100 / 100 / 100 / 100
  - `TagQueuePanel.tsx`: PASS 100 / 96.15 / 100 / 100
  - `AdminSidebar.tsx`: PASS 100 / 100 / 100 / 100
  - `SchemaDiffPanel.tsx`: PASS 100 / 95.65 / 100 / 100
  - `MemberDrawer.tsx`: PASS 96.64 / 84.61 / 90.9 / 96.64
  - `MeetingPanel.tsx`: PASS 98.02 / 84.44 / 100 / 98.02
  - `AuditLogPanel.tsx`: PASS 100 / 98.73 / 100 / 100
- regression: existing web test suite passed in the same coverage run
- evidence: `outputs/phase-11/vitest-run.log` and `outputs/phase-11/coverage-target-files.txt`
