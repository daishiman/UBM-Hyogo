# Phase 11 Test Report

| AC | Evidence | Expected |
| --- | --- | --- |
| AC-1 tag candidates | `evidence/mobile-expanded.png` | Tag candidate chips are visible. |
| AC-3 five-tag limit | `evidence/mobile-limit-reached.png` | Limit hint is visible and the sixth candidate is disabled. |
| AC-4 mobile collapsed summary | `evidence/mobile-initial.png` | Filter body is hidden on first mobile render. |
| AC-6 repeated tag query | `evidence/desktop-picker-and-selected.png` | Selected tags from `?tag=ai&tag=design` are restored. |

Command:

```bash
pnpm --filter @ubm-hyogo/web exec playwright test members-filter-mobile --project=desktop-chromium --reporter=line
```
