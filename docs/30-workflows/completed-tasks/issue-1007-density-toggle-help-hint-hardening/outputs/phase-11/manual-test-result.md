# Phase 11 Manual Test Result

## Classification

- task: `issue-1007-density-toggle-help-hint-hardening`
- state: `implemented_local_runtime_pending`
- visual category: `VISUAL`

## Local Evidence

| Evidence | Result | Command / Path |
| --- | --- | --- |
| focused component test | PASS, 15 passed | `mise exec -- pnpm exec vitest run apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` |
| typecheck | PASS, exit 0 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| design token gate | PASS, 9 passed | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` |
| lint | PASS, exit 0 | `mise exec -- pnpm lint` |
| visual screenshot: HelpHint closed | PASS, saved | `outputs/phase-11/screenshots/density-toggle-help-closed.png` |
| visual screenshot: HelpHint open | PASS, saved | `outputs/phase-11/screenshots/density-toggle-help-open.png` |
| visual screenshot: segmented | PASS, saved | `outputs/phase-11/screenshots/density-toggle-segmented.png` |
| screenshot metadata | PASS, saved | `outputs/phase-11/phase11-capture-metadata.json` |

## Screenshot Evidence Matrix

| テストケース | Result | スクリーンショット |
| --- | --- | --- |
| TC-4 | PASS | `outputs/phase-11/screenshots/density-toggle-help-open.png` |
| TC-5 | PASS | `outputs/phase-11/screenshots/density-toggle-help-open.png` |
| TC-7 | PASS | `outputs/phase-11/screenshots/density-toggle-help-closed.png` |
| TC-8 | PASS | `outputs/phase-11/screenshots/density-toggle-help-closed.png`, `outputs/phase-11/screenshots/density-toggle-segmented.png` |

## Runtime Boundary

Runtime `/members` route capture was attempted locally but the Next dev server did not return routes before timeout in this environment. As a local visual fallback, Playwright captured the `DensityToggle` DOM contract with the app CSS rules and saved the three required Phase 11 screenshots above. The component behavior is locally fixed by focused jsdom tests for unique `aria-describedby`, Escape close, outside pointer close, native summary toggle, Tab non-close, icon rendering, and unmount cleanup.

Staging deploy, authenticated visual baseline capture, commit, push, and PR creation remain user-gated.
