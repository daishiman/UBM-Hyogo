# Phase 11 visual evidence — serial-05-step-02

## Verdict

`completed_local_evidence_captured`

## Captured screenshots

| State | File |
| --- | --- |
| inline confirm open | `02-inline-confirm-open.png` |
| success toast | `04-success-toast.png` |
| error 409 | `05-error-409.png` |
| error 400 | `06-error-400.png` |

## Capture command

```bash
ENVIRONMENT=local SENTRY_ENVIRONMENT=local SENTRY_TRACES_SAMPLE_RATE=0 \
PLAYWRIGHT_TEST=1 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
PUBLIC_API_BASE_URL=http://127.0.0.1:8787 INTERNAL_API_BASE_URL=http://127.0.0.1:8787 \
AUTH_URL=http://localhost:3000 AUTH_SECRET=playwright-e2e-auth-secret-32-bytes \
PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1 PORT=3000 \
pnpm --filter @ubm-hyogo/web dev:webpack

ESBUILD_BINARY_PATH=$(pwd)/node_modules/@esbuild/darwin-arm64/bin/esbuild \
pnpm exec tsx <inline Playwright screenshot capture script>
```

## Notes

- Existing UI is an inline two-step confirmation panel, not a dialog modal.
- Screenshots were captured at 1440x900 viewport / DPR 2.
- `pnpm exec playwright install chromium` was required because local browser binaries were absent.
