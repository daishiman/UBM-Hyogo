# Manual Smoke Log

| Check | Result | Evidence |
| --- | --- | --- |
| P1 section markers | PASS | `section-presence.txt` |
| selector contract | PASS | `grep-selectors.txt` |
| visual runtime | delegated | `serial-07-regression-evidence/` |
| local dev screenshot attempt | BLOCKED | `pnpm --filter @ubm-hyogo/web dev --hostname 127.0.0.1 --port 3219` failed during instrumentation env validation: `ENVIRONMENT`, `NEXT_PUBLIC_API_BASE_URL`, `PUBLIC_API_BASE_URL`, `INTERNAL_API_BASE_URL`, `AUTH_URL`, `SENTRY_ENVIRONMENT`, and `SENTRY_TRACES_SAMPLE_RATE` were missing/invalid in this shell. No screenshot was claimed. |
