# Workflow Artifact Inventory — japanese-ime-input-composition-search-fix

| item | value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/japanese-ime-input-composition-search-fix/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| taskId | `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX` |
| implementation targets | `apps/web/src/hooks/useImeSafeInput.ts`, `apps/web/src/components/ui/Search.tsx`, `apps/web/src/components/ui/Input.tsx`, `apps/web/src/components/public/SelectedFiltersBar.client.tsx` |
| tests | `apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx`, `apps/web/src/components/ui/__tests__/{Search,Input}.spec.tsx`, `apps/web/src/components/public/__tests__/{SelectedFiltersBar.client,MemberFilters.client}.spec.tsx` |
| local evidence | focused Vitest 5 files / 26 tests PASS, `@ubm-hyogo/web` typecheck PASS, `@ubm-hyogo/web` lint PASS, local `/members` screenshots 2 PNG PASS |
| runtime boundary | staging real-IME screenshots, commit, push, PR are user-gated |

## Contract

- Public member keyword search keeps URL as the canonical query state, but `Search` buffers draft input during IME composition and commits only after `compositionend` plus debounce.
- `useImeSafeInput` owns composition guarding, debounce commit, external value synchronization, timer cleanup, and `commitNow` immediate clear.
- The keyword clear control is owned by the search input. `SelectedFiltersBar` no longer renders a `q` chip, avoiding duplicate clear buttons while preserving zone/status/tag chips and focus handoff.
- `Input` exposes `imeSafe` / `onValueChange` / `debounceMs` as opt-in props; existing `Input` behavior remains unchanged when `imeSafe` is false or `onValueChange` is omitted.

## Lessons Learned

- IME-safe controlled inputs that trigger URL/router updates need a local draft buffer; committing every `onChange` can remount or reset `value` and break composition.
- Search summary chips should not duplicate an input-local clear action for the same field. If a visible active value remains in the input, the summary bar can focus on non-text filters.
- IME unit tests should use fake timers plus `compositionStart` / `compositionEnd` and assert that commits are suppressed until the finalized value is available.
