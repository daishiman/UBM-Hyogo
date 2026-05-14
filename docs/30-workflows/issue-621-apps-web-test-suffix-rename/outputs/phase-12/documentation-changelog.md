# Documentation Changelog

## Entry Checklist

`git status --porcelain apps/ packages/` found apps/web rename and reference-sync changes. The task was therefore closed as `implemented_local_evidence_captured`, not `spec_created`.

## Changed Files

- `docs/30-workflows/issue-621-apps-web-test-suffix-rename/artifacts.json`
- `docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/verification-report.md`
- `docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11/*`
- `docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-12/*`
- `docs/30-workflows/issue-621-apps-web-test-suffix-rename/index.md`
- `docs/30-workflows/issue-621-apps-web-test-suffix-rename/phase-*.md`
- `apps/web/**/*.spec.ts(x)` rename targets
- `apps/web/src/lib/api/me-types.spec-d.ts`
- `apps/web/package.json`
- `.github/workflows/ci.yml`
- `scripts/lint-boundaries.mjs`
- `scripts/lint-stablekey-literal.mjs`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `docs/30-workflows/unassigned-task/task-issue-325-followup-001-apps-web-test-suffix-rename.md`

## Validator Results

| Command | Exit | Evidence |
| --- | ---: | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web test --reporter=verbose` | 0 | `outputs/phase-11/test-after-full.log` |
| `mise exec -- pnpm typecheck` | 0 | `outputs/phase-11/typecheck.log` |
| `mise exec -- pnpm lint` | 0 | `outputs/phase-11/lint.log` |
| `mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens` | 0 | `outputs/phase-11/verify-design-tokens.log` |
| `rg -n "apps/web.*\\.test\\." --glob '!**/node_modules/**' --glob '!docs/**'` | 1 | 0 matches in `outputs/phase-11/glob-coverage-grep.log` |
| `diff -u test-count-before.normalized.txt test-count-after.normalized.txt` | 0 | empty diff |
