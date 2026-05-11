# workflow-task-16-admin-tags-meetings-requests Artifact Inventory

| Category | Artifact |
| --- | --- |
| workflow root | `docs/30-workflows/task-16-admin-tags-meetings-requests/` |
| root artifacts | `artifacts.json`, `outputs/artifacts.json` |
| phases | `phase-01.md` through `phase-13.md` |
| Phase 11 | `outputs/phase-11/main.md`, `manifest.md`, `manual-smoke-log.md`, `link-checklist.md` |
| Phase 12 strict 7 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| implementation targets | `apps/web/app/(admin)/admin/{tags,meetings,requests}/page.tsx` |
| UI targets | `apps/web/src/components/admin/{TagQueuePanel,MeetingPanel,RequestQueuePanel}.tsx` |
| API helpers | `apps/web/src/lib/admin/{api,server-fetch}.ts` |
| tests | `apps/web/src/components/admin/__tests__/{TagQueuePanel,MeetingPanel,RequestQueuePanel}.test.tsx`, `apps/web/playwright/tests/{admin-pages,admin-requests}.spec.ts` |
| same-cycle code fix | `MeetingPanel` CSV export link removed; `MeetingPanel.test.tsx` asserts absence |
| user-gated | runtime screenshots, staging smoke, commit, push, PR |
