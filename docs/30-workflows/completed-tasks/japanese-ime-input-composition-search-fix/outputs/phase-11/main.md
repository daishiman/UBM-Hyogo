# 手動テスト / 証跡（Phase 11 正本）

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- workflow_state: `implemented_local_evidence_captured`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- closeout: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

## Two-Tier Evidence

| Tier | Evidence | Status |
| --- | --- | --- |
| Tier 1 local unit/render | focused Vitest 5 files / 26 tests | present / PASS |
| Tier 1 local quality | `@ubm-hyogo/web` typecheck + lint | present / PASS |
| Tier 1 local runtime visual | local `/members` Playwright screenshots | present / PASS |
| Tier 2 staging IME visual | staging/browser IME screenshots | user-gated pending |

## Local Evidence Commands

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx apps/web/src/components/ui/__tests__/Search.spec.tsx apps/web/src/components/ui/__tests__/Input.spec.tsx apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

## Runtime Visual Plan

Local browser screenshots captured in this cycle:

| Screenshot | Purpose | Status |
| --- | --- | --- |
| `outputs/phase-11/screenshots/member-search-local-overview.png` | `/members` baseline filter UI renders without schema/runtime error | present |
| `outputs/phase-11/screenshots/member-search-local-keyword-filter.png` | `q=テスト` + zone filter shows input clear button and no duplicate `検索: ...` summary chip | present |

The remaining visual screenshots require a real browser/staging session with Japanese IME:

| Screenshot | Purpose | Status |
| --- | --- | --- |
| `member-search-ime-composing.png` | composing text does not update `?q=` | user-gated pending |
| `member-search-ime-committed.png` | committed text updates search after debounce | user-gated pending |
| `member-search-cleared.png` | keyword clear is single-owner and immediate | user-gated pending |

Runtime screenshots are not required to claim local implementation completion; they remain user-gated evidence.
