# Documentation Changelog（Phase 12）

## 2026-06-02

| Area | Change |
| --- | --- |
| apps/web | Added `useImeSafeInput`, made `Search` IME-safe, added `Input.imeSafe`, removed keyword `q` chip from `SelectedFiltersBar` |
| tests | Added focused IME hook/Search/Input tests and updated selected-filter/member-filter tests |
| workflow | Reclassified from spec-only draft to `implemented_local_evidence_captured` local close-out |
| aiworkflow requirements | Added task ledger, quick-reference/resource-map entries, artifact inventory, lessons, UI component pattern, changelog |
| Phase 13 | Added local output stubs for local check, change summary, PR info, and PR creation result |

## Verification

- focused Vitest 5 files / 26 tests PASS
- `@ubm-hyogo/web` typecheck PASS
- `@ubm-hyogo/web` lint PASS
- local `/members` Playwright screenshots 2 files PASS

## User-Gated

Staging real-IME screenshots, commit, push, and PR remain gated by explicit user approval.
