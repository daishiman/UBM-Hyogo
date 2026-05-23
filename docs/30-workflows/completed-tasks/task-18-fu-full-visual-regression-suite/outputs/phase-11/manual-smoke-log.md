# Phase 11 Manual Smoke Log

## Execution mode

`implemented_local_runtime_pending` — local app-side Playwright code/config and workflows exist. Screenshot runtime execution is still pending because 51 Linux baselines have not been generated.

| Check | Expected | Actual | Status |
| --- | --- | --- | --- |
| Phase 1-13 spec files exist | 13 phase files are present | Present | `completed` |
| Phase 12 strict 7 outputs exist | Canonical 7 filenames are present | Present | `completed` |
| Root/output artifacts parity | `artifacts.json` and `outputs/artifacts.json` match | Present; validated by `cmp -s` in Phase 12 | `completed` |
| Playwright visual-full test inventory | 51 tests are listed across 3 projects | Present via `playwright test --list` | `completed` |
| Runtime screenshots | 51 tracked PNG baselines exist | Not executed; baseline update remains user-gated | `runtime_pending` |

## Runtime command template

The baseline/runtime cycle must replace this section with tracked evidence:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:visual-full
```

Output must be stored as `.txt` / `.json` under `outputs/phase-11/evidence/`.
