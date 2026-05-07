# Workflow Task 08 W2 Design Tokens Doc Artifact Inventory

## 09b Design Tokens Doc

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/task-08-w2-design-tokens-doc/` |
| token SSOT | `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
| source | `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70 |
| status | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |

## OKLch Token Scope

09b fixes stone / warm / cool OKLch values, surface/text/border HEX values, radius, shadow, font, spacing, motion, sRGB fallback, and dark mode placeholder.

## Tailwind Theme Inline Contract

task-09 consumes 09b to create `apps/web/src/styles/tokens.css` and Tailwind v4 `@theme inline` bridge. task-10 consumes the same token names in primitives. task-18 consumes 09b as the verify-design-tokens source.

## Compatibility Mapping

09b records the migration from legacy short names such as `--ubm-bg`, `--ubm-text-2`, and `--ubm-accent` to canonical `--ubm-color-*` names.
The stale temporary member blueprint reference `09e-design-tokens.md` is normalized to `09b-design-tokens.md`.
Task-09 snippets, task-18 verifier contract, 09-ui-ux, and 09c primitive anchors consume 09b as the single token SSOT.

## Evidence

| Evidence | Path |
| --- | --- |
| Phase 11 summary | `docs/30-workflows/task-08-w2-design-tokens-doc/outputs/phase-11/main.md` |
| Phase 11 logs | `docs/30-workflows/task-08-w2-design-tokens-doc/outputs/phase-11/evidence/` |
| Phase 12 compliance | `docs/30-workflows/task-08-w2-design-tokens-doc/outputs/phase-12/phase12-task-spec-compliance-check.md` |
