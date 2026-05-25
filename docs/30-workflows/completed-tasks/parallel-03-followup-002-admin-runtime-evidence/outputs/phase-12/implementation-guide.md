# Implementation Guide

[実装区分: 実装仕様書]

## Scope

This task closes EV-12 only: prove that the already-implemented admin AppShell data contract is present in runtime DOM.

## Implemented Changes

| Path | Change |
| --- | --- |
| `apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts` | Added focused Playwright scrape/assertion spec using `adminPage` and `mockApi` fixtures |
| `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt` | Generated EV-12 DOM scrape text evidence |
| `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md` | Updated EV-12 to `present`; kept EV-13/15/16 as valid `pending` rows with explicit delegation |
| `.claude/skills/aiworkflow-requirements/*` | Updated active workflow and artifact inventory references for this follow-up |

## Verification Command

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-followup-002-admin-runtime-evidence/outputs/phase-11 \
  pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/parallel-03-admin-shell-scrape.spec.ts --project=desktop-chromium --reporter=line
```

## Screenshot Reference

Not applicable for this task (`visualEvidence: NON_VISUAL`). The required visual baseline for admin/member full chrome remains tracked in serial-07 / UT-DSF-07 (#829). The concrete runtime evidence for this task is the DOM scrape:

- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt`

## PR Message Source

Use this summary in the PR body after user approval:

```text
Refs #833

## Summary
- add a focused Playwright runtime DOM scrape for admin AppShell EV-12
- mark parent parallel-03 EV-12 as present and keep EV-13/15/16 delegated with valid pending statuses
- record Phase 11/12 local evidence without production code changes

## Verification
- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/parallel-03-admin-shell-scrape.spec.ts --project=desktop-chromium --reporter=line
- pnpm --filter @ubm-hyogo/web typecheck
- pnpm --filter @ubm-hyogo/web lint
- pnpm verify:phase12-compliance
- pnpm gate-metadata:validate
```
