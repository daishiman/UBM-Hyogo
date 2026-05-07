# Phase 11 Evidence Manifest: 08b-A-playwright-e2e-full-execution

## Status

`PENDING_RUNTIME_EVIDENCE`

This workflow formalizes the full-execution contract. Actual Playwright execution, screenshots, axe report capture, CI gate promotion, deploy, commit, push, and PR creation require explicit user approval.

## Required Evidence Paths

| Evidence | Required path | PASS condition |
| --- | --- | --- |
| Playwright HTML report | `outputs/phase-11/evidence/playwright-report/html/` | Report exists after unskipped suite execution |
| Playwright JSON report | `outputs/phase-11/evidence/playwright-report/results.json` | JSON report records executed tests, not skipped-only green |
| Axe report | `outputs/phase-11/evidence/axe/axe-report.json` | Real `violations[]` array from executed pages |
| Desktop screenshots | `outputs/phase-11/evidence/screenshots/desktop/*.png` | Desktop route/state matrix captured with synthetic data |
| Mobile screenshots | `outputs/phase-11/evidence/screenshots/mobile/*.png` | Mobile route/state matrix captured with synthetic data |
| Admin UI gate | `outputs/phase-11/evidence/admin/ui-gate-403-or-redirect.md` | Non-admin `/admin/*` access proves UI gate behavior |
| Admin API gate | `outputs/phase-11/evidence/admin/direct-api-403.md` | Direct `/api/admin/*` fetch proves API gate without UI |
| Admin content ownership gate | `outputs/phase-11/evidence/admin/foreign-content-edit-403.md` | Admin session cannot edit another member's protected content endpoint |
| Secret hygiene | `outputs/phase-11/evidence/secret-hygiene-review.md` | Screenshots/traces/reports contain no token, cookie, or real personal data |
| Skip inventory | `outputs/phase-11/evidence/skip-inventory.txt` | `test.describe.skip` inventory is zero before CI gate promotion |

## Screenshot Matrix Minimum

Runtime capture must save at least 30 screenshots across desktop and mobile. The matrix must include public, member-auth, admin dashboard, admin members, admin tags queue, admin schema, admin meetings, denied/non-admin, loading, empty, and error states where applicable. A run with fewer than 30 screenshots remains `PENDING_RUNTIME_EVIDENCE` unless the missing routes are documented as unreachable blockers in `outputs/phase-11/evidence/discovered-issues.md`.

## Runtime Commands

```bash
pnpm install --frozen-lockfile
pnpm --filter @ubm-hyogo/web test:e2e:list
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm --filter @ubm-hyogo/web test:e2e
rg "test\\.describe\\.skip" apps/web/playwright/tests
find docs/30-workflows/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence/screenshots -name '*.png' | wc -l
jq '[.violations[]?] | length' docs/30-workflows/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence/axe/axe-report.json
```

## GO / NO-GO

| Gate | Decision rule |
| --- | --- |
| Local full execution | GO only after Auth.js-compatible fixture or UI login helper and deterministic D1 seed/reset are implemented |
| PR/push CI gate | GO only after skipped spec inventory is zero and all required evidence paths contain fresh runtime evidence |
| 09a staging handoff | GO only after local full execution evidence is complete or explicit blocker is recorded |
