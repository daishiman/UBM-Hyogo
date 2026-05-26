# Issue #903 member runtime evidence lessons

Date: 2026-05-25

## Lessons

- L-I903-001: Delegated evidence is not valid unless the delegate workflow explicitly lists the EV-ID or target route in its Phase 11 inventory / Phase 8 DoD. Grep the delegate before treating an evidence row as transferred.
- L-I903-002: Next.js route groups can resolve AppShell evidence gaps without URL changes. Moving an existing route such as `/profile` under `(member)` is lower risk than creating a stub route solely for evidence.
- L-I903-003: Route physical moves must update static invariant path walkers and eslint override globs in the same wave. `app/profile` string checks are part of the implementation surface, not documentation cleanup.
- L-I903-004: AppShell runtime scrape specs should deduplicate selector output when one element satisfies multiple data-* selectors, while asserting each required attribute separately.
- L-I903-005: After route physical moves, update the owning system-spec indexes and artifact inventories for current implementation targets in the same wave. Keep the old path only in explicit historical rows such as "stale route removed".

## Applied Example

- Workflow: `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/`
- Code: `apps/web/app/(member)/profile/**`, `apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts`
- Evidence: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt`, `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/screenshots/member-shell.png`
