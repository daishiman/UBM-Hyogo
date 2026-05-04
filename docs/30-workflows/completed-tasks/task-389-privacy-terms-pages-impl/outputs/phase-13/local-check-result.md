# local-check-result

Executed on 2026-05-03 JST.

| Command | Result |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web test -- privacy terms` | PASS: 35 files / 271 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web build` | FAIL: `/_global-error` prerender `Cannot read properties of null (reading 'useContext')` |

Build failure matches the existing #385 / `task-05a-build-prerender-failure-001` signature and is outside the privacy / terms page diff.
