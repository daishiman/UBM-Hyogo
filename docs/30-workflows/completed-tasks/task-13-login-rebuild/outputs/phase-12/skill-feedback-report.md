# Skill Feedback Report

## Template Improvement

Phase 12 strict 7 outputs must be generated even for `spec_created / implementation / VISUAL_ON_EXECUTION` packages. A workflow with Phase 1-13 files but no `outputs/phase-12/` directory is not compliant.

## Workflow Improvement

Package command contracts must be discovered from `package.json` before writing gates. For this repo, the web package is `@ubm-hyogo/web`; stale `pnpm --filter web` is invalid.

## Documentation Improvement

UI implementation specs should place downstream Playwright locator contracts in Phase 3, not only in Phase 9. For task-13 the stable contract is `data-testid="login-card"` plus `data-state`.

## Routing

| Item | Owner | Action |
| --- | --- | --- |
| strict 7 output requirement | task-specification-creator | applied in this workflow |
| command drift rule | task-specification-creator | logged in `_legacy.md` |
| task-13 canonical registration | aiworkflow-requirements | applied in indexes and active workflow |
| new skill reference file | no-op | existing rules cover this case |
