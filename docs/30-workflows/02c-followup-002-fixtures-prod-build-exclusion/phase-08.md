# Phase 8: DRY Review

## Duplication boundaries

- Do not duplicate fixture definitions to satisfy build exclusion.
- Do not create parallel repository setup files for 02a / 02b / 02c unless tests require it.
- Prefer one build config boundary and one import boundary rule over per-file comments as the only control.

## Reuse

Reuse existing boundary lint patterns in `.dependency-cruiser.cjs` and existing package scripts where possible.

## Completion

The design avoids broad monorepo tsconfig redesign and keeps this task scoped to `apps/api`.
