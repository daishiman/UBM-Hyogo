# Phase 11 Evidence Index

- task_id: `admin-members-mobile-responsive-layout`
- state: `implemented_local_evidence_captured`
- visualEvidence: `VISUAL`
- visual screenshots: `css_contract_screenshots_captured`

## Evidence Inventory

| Evidence | Path | Status | Result |
| --- | --- | --- | --- |
| focused component test | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | present | `25 passed` |
| Playwright CSS contract | `apps/web/playwright/tests/admin-members-mobile.spec.ts` | present | desktop-chromium 5 passed |
| CSS-contract screenshots | `outputs/phase-11/screenshots/*.png` | present | 375 / 640 / 1280 captured, overflowPass=true |
| screenshot metrics | `outputs/phase-11/screenshots/screenshot-metrics.json` | present | 375 / 640 / 1280 overflowPass=true |
| manual checklist | `outputs/phase-11/manual-test-result.md` | present | CSS-contract screenshots captured |
| discovered issues | `outputs/phase-11/discovered-issues.md` | present | 0 open |
| visual sanity review | `outputs/phase-11/ui-sanity-visual-review.md` | present | local markup/CSS review complete, screenshots captured |
| canonical paths | `outputs/phase-11/canonical-paths.json` | present | manifest for captured screenshots |

## Commands

```bash
pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx
PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-members-mobile-responsive-layout/outputs/phase-11 pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/admin-members-mobile.spec.ts --project=desktop-chromium
pnpm --filter @ubm-hyogo/web exec node --input-type=module <screenshot-capture-script>
```

## Boundary

Local implementation, focused component tests, CSS-contract browser tests, and CSS-contract Chromium screenshots are complete. Authenticated `/admin/members` route screenshots remain user-gated and are not represented as captured.
