# Phase 9 Main

Coverage/quality gate evidence is local-command based for this workflow. Full coverage guard was run from the repository root after implementation and documentation synchronization:

```bash
bash scripts/coverage-guard.sh
```

Result: PASS. All package coverage gates were at or above 80%:

- `apps/api`: lines 85.63%, branches 84.7%, functions 88.76%, statements 83.73%
- `apps/web`: lines 84.1%, branches 86.1%, functions 88.57%, statements 84.1%
- `packages/contracts`: lines 100%, branches 100%, functions 100%, statements 100%
- `packages/integrations`: lines 100%, branches 100%, functions 100%, statements 100%
- `packages/shared`: lines 96.37%, branches 86.61%, functions 97.91%, statements 96.37%
- `packages/integrations/google`: lines 89.16%, branches 80.6%, functions 88.23%, statements 89.16%

Focused regression evidence:

- `pnpm --filter @ubm-hyogo/api test apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` - PASS
- `pnpm --filter @ubm-hyogo/web test apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx apps/web/src/components/public/__tests__/SelectedTagsBar.client.spec.tsx` - PASS
- `pnpm --filter @ubm-hyogo/web exec playwright test members-filter-mobile --project=desktop-chromium --reporter=line` - PASS
