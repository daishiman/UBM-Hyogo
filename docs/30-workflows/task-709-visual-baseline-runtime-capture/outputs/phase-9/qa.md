# Phase 9 QA

State: `runtime_pending`

The final QA commands are defined but not executed in this cycle because the implementation steps include user-gated workflow dispatch, baseline import, commit, push, and PR creation.

## Required Commands After Approval

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
yq '.' .github/workflows/playwright-visual-full.yml > /dev/null
ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png | wc -l
gh run list --workflow=playwright-visual-full.yml --branch=task/709-visual-baseline-runtime-capture --limit=2 --json conclusion,headSha,databaseId
```

## Current Verdict

`runtime_pending` — no PASS is claimed until the commands above are run and pasted here with exit codes.
