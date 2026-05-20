# Phase 11 Evidence — issue-776 schema alias bulk resolve

## 状態

Local Playwright fixture による `/admin/schema` bulk resolve visual evidence を取得済み。
Staging D1 / production-equivalent smoke、commit、push、PR は user-gated のまま。

## Captured Evidence

| Evidence | Status |
| --- | --- |
| `bulk-select-desktop-1280.png` | captured |
| `bulk-modal-desktop-1280.png` | captured |
| `bulk-partial-failure-desktop-1280.png` | captured |
| `bulk-success-desktop-1280.png` | captured |
| `bulk-select-mobile-375.png` | captured |
| `bulk-modal-mobile-375.png` | captured |
| `perf-30rows.md` | captured |
| `a11y-manual-check.md` | captured |
| `phase11-capture-metadata.json` | captured |

## Command

```bash
PLAYWRIGHT_EVIDENCE_TASK=issue-776-schema-alias-bulk-resolve mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/issue776-schema-bulk-resolve.spec.ts --project=desktop-chromium
```

Result: 3/3 passed. The local fixture covers 30 selected rows, success, partial failure, desktop 1280, and mobile 375.
