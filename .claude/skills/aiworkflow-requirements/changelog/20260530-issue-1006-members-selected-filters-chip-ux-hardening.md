# 2026-05-30 issue-1006-members-selected-filters-chip-ux-hardening

Synchronized `issue-1006-members-selected-filters-chip-ux-hardening` as `implemented_local_runtime_pending / implementation / VISUAL`.

- Implemented `/members` selected filter chip UX hardening in `SelectedFiltersBar.client.tsx`, `MemberFilters.client.tsx`, and `legacy-public.css`.
- Added focused coverage for tag label resolution, unknown-code fallback, deterministic focus restoration, final-chip search focus fallback, and `sort` non-chip regression.
- Registered workflow root, artifact inventory, quick-reference, resource-map, and task-workflow-active entries. Focused Vitest count corrected to the close-out `vitest run` value (17/17; an intermediate `16` had drifted across skill surfaces).
- Added `lessons-learned/lessons-learned-issue-1006-members-selected-filters-chip-ux-hardening-2026-05.md` (L-I1006-001..006: `document` access via `isBrowser()` + scoped `no-restricted-globals` disable; VISUAL surface behind auth gate → component-harness evidence + runtime-pending screenshots; re-render-spanning focus restoration via chipRefs Map + pendingFocusRef + signature useEffect; unmount fallback focus delegated to parent `onEmpty`; `Object.hasOwn` defensive tag-label resolution from existing `topTags`; test-count single source of truth). Inventory `## Lessons Learned` section added.
- Preserved runtime boundary: data-backed visual screenshots are pending because local `/public/members` returned 500 without AUTH_SECRET / backend auth configuration; staging verification remains user-gated.
