# Workflow Artifact Inventory: issue-1006-members-selected-filters-chip-ux-hardening

| Artifact | Purpose |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-1006-members-selected-filters-chip-ux-hardening/` | canonical workflow root |
| `docs/30-workflows/completed-tasks/issue-1006-members-selected-filters-chip-ux-hardening/artifacts.json` | root metadata |
| `docs/30-workflows/completed-tasks/issue-1006-members-selected-filters-chip-ux-hardening/outputs/artifacts.json` | output mirror |
| `docs/30-workflows/completed-tasks/issue-1006-members-selected-filters-chip-ux-hardening/outputs/phase-11/manual-test-result.md` | local evidence boundary |
| `docs/30-workflows/completed-tasks/issue-1006-members-selected-filters-chip-ux-hardening/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance |

## Implementation Surface

| Path | Change |
| --- | --- |
| `apps/web/src/components/public/SelectedFiltersBar.client.tsx` | `tagLabels` label resolution, fallback `#code`, deterministic chip focus restoration, `onEmpty` fallback hook |
| `apps/web/src/components/public/MemberFilters.client.tsx` | `topTags` -> `tagLabels` derivation and search input fallback focus |
| `apps/web/src/styles/legacy-public.css` | `<=640px` selected filter bar vertical stacking |
| `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | label, fallback, focus, sort regression coverage |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | label derivation and final-chip focus fallback coverage |

## Evidence

- focused Vitest: `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` -> 2 files / 17 tests PASS.
- typecheck: `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` -> PASS.
- design tokens: `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` -> 9 tests PASS.
- lint: `mise exec -- pnpm lint` -> PASS.
- local Playwright runtime sanity: `/members?tag=ai&zone=0_to_1&q=test` at `<=640px` produced selected filter bar `flex-direction=column`, `align-items=stretch`, and clear button `align-self=flex-end`.

## Runtime Boundary

Local data-backed visual screenshots remain pending because `/public/members` returned 500 without AUTH_SECRET / backend auth configuration in the local dev server. This does not block semantic/focus coverage because the component receives `topTags` through props and the focused tests exercise both label and fallback paths. Staging data-backed screenshots, commit, push, and PR are user-gated.

## Lessons Learned

`.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-1006-members-selected-filters-chip-ux-hardening-2026-05.md`

- **L-I1006-001**: `document` 直接アクセスは `isBrowser()` ガード + scoped `no-restricted-globals` disable で通す（implementation-guide の素朴な `document.getElementById` は lint fail。本タスク最大の苦戦箇所）。
- **L-I1006-002**: VISUAL public surface が auth/backend gate 越し（local `/public/members` 500）のとき、focused Vitest + Playwright component-harness を一次証跡、data-backed full-page screenshot は runtime pending に倒す。
- **L-I1006-003**: 再レンダーをまたぐ chip 削除の focus 復帰は `chipRefs` Map + `pendingFocusRef` + signature `useEffect` で実装。
- **L-I1006-004**: 最後の chip 削除で bar が unmount する fallback focus は親 `MemberFilters` に `onEmpty` で委譲し state ownership を分離。
- **L-I1006-005**: tag 表示名は既存 `topTags` 由来 + `Object.hasOwn` 防御 fallback で解決し、新 API / D1 を増やさない（未登録 / prototype key で throw しない）。
- **L-I1006-006**: skill 同期の test 件数は close-out の実 `vitest run` 出力（17/17）を正本にし、中間 run の値（16）で drift させない。
