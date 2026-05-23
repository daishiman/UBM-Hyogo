# Phase 11 Evidence Boundary

This workflow is `implemented_local_runtime_pending`. Runtime screenshots are produced by the focused Playwright spec:

```bash
pnpm --filter @ubm-hyogo/web exec playwright test members-filter-mobile --project=desktop-chromium --reporter=line
```

Expected screenshot outputs:

- `outputs/phase-11/evidence/mobile-initial.png`
- `outputs/phase-11/evidence/mobile-expanded.png`
- `outputs/phase-11/evidence/mobile-limit-reached.png`
- `outputs/phase-11/evidence/desktop-picker-and-selected.png`

Commit, push, PR, and external deployment remain user-gated.
