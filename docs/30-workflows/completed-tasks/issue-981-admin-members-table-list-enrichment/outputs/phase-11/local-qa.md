# Phase 11 Local QA

## Verified

| Area | Evidence |
| --- | --- |
| Component tests | `MembersTable.spec.tsx` 21 PASS |
| Lint/typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web lint` PASS |
| Design token gate | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` PASS |
| Production build | `mise exec -- pnpm --filter @ubm-hyogo/web build` PASS with existing Sentry/Prisma dynamic dependency warnings |
| Phase 4 cases | TC-MT-06 through TC-MT-13 implemented and green |
| Phase 6 cases | TC-MT-14 through TC-MT-20 implemented and green |
| Local screenshots | `admin-members-table-enriched.png`, `admin-members-table-untagged.png` |
| API/schema boundary | No `apps/api` or `packages/shared` changes |

## Pending User-Gated Work

- Authenticated staging `/admin/members` visual baseline
- Staging deploy / runtime smoke
- Commit / push / PR
