# Phase 11 Local QA

## Commands

| Command | Result |
| --- | --- |
| `pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/MemberPublishSwitch.spec.tsx apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx apps/web/src/features/admin/components/__tests__/MembersFilters.spec.tsx apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx apps/web/src/features/admin/components/_shared/__tests__/PillNav.spec.tsx apps/web/src/features/admin/components/_shared/__tests__/TagPill.spec.tsx apps/web/src/lib/admin/member-hue.spec.ts` | PASS: 7 files / 25 tests |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | PASS |
| local Chrome screenshot capture against `http://127.0.0.1:3010` + mock API `http://127.0.0.1:8787` | PASS: 16 screenshots |

## Notes

The project Playwright browser cache was missing Chromium, so direct capture used installed Google Chrome. The first config-driven Playwright attempt was not used as evidence.
