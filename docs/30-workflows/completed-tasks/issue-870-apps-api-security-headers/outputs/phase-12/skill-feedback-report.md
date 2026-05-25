# Skill Feedback Report

## Template Improvements

- Implementation specs that include real code targets should not default to "実装は後続サイクル" when CONST_004/005 is active.
- Phase 12 strict 7 should explicitly include `main.md`; a six-file list is incomplete.

## Workflow Improvements

- Package command examples should prefer existing scripts or `pnpm exec vitest ...`; `pnpm --filter <pkg> vitest ...` is invalid unless the package defines a `vitest` script.

## Documentation Improvements

- CORS specs should choose one of two designs explicitly: library middleware or hand-written deny-by-default middleware. Mixing `hono/cors` prose with hand-written implementation creates review drift.
