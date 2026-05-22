# 2026-05-17 issue-748 jest-axe primitive a11y integration

- workflow root: `docs/30-workflows/completed-tasks/issue-748-jest-axe-primitive-a11y-integration/`
- implementation: added shared `apps/web/src/test/axe.ts` and real axe checks to `parallel09-primitives.component.spec.tsx`.
- evidence: focused primitive Vitest 26 tests, root typecheck, and root lint passed locally.
- evidence: full `pnpm --filter web test` passed locally and is captured under Phase 11.
- spec sync: `references/testing-accessibility.md` now documents the Vitest inline axe pattern instead of `expect.extend(toHaveNoViolations)`.
- source: `parallel-09-followup-003-jest-axe-real-a11y-integration.md` consumed.
- user gate: commit, push, PR, and issue mutation remain blocked.
