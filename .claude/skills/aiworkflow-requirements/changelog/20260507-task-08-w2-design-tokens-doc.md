# 2026-05-07 task-08 W2 design tokens doc

UI prototype alignment / MVP recovery の task-08 W2 design tokens doc を aiworkflow-requirements に同期した。

## Summary

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/task-08-w2-design-tokens-doc/` |
| status | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| token SSOT | `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
| source | `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70 |
| downstream | task-09 `tokens.css` / `@theme inline`, task-10 primitives, task-18 verifier |

## Updated Files

- `docs/00-getting-started-manual/specs/09b-design-tokens.md`
- `docs/00-getting-started-manual/specs/00-overview.md`
- `docs/00-getting-started-manual/specs/09-ui-ux.md`
- `docs/00-getting-started-manual/specs/09c-primitives.md`
- `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## Notes

- Old `specs/design-tokens.md` references were normalized to `specs/09b-design-tokens.md`.
- Old temporary `09e-design-tokens.md` reference in member screen blueprints was normalized to `09b-design-tokens.md`.
- Downstream task-09 snippets, task-18 verifier contract, and 09c primitive anchors were synced to 09b canonical token names and `@theme inline`.
- Existing `09c-primitives.md` short token names remain documentation input only; 09b defines the compatibility mapping for task-10.
- No apps/packages code was changed in this docs-only wave.
