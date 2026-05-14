# Phase 11 manual smoke log

## Status

`runtime_partial`: local typecheck / lint / coverage-merge test / classification checks were executed.
Full D1 coverage, web coverage, packages coverage, and GitHub Actions matrix wall-clock evidence remain
`runtime_pending` until the implementation branch is pushed and CI runs.

## Required smoke records after implementation

| Smoke | Required data |
| --- | --- |
| api unit coverage | command, exit code, duration, coverage path |
| api d1 coverage | command, exit code, duration, `EADDRNOTAVAIL|EADDRINUSE` grep result |
| web coverage | command, exit code, duration, coverage path |
| packages coverage | command, exit code, duration, coverage path |
| aggregate gate | command, exit code, aggregate coverage percentages |

## Executed records in this cycle

| Smoke | Result |
| --- | --- |
| typecheck | `mise exec -- pnpm typecheck` exit 0 |
| lint | `mise exec -- pnpm lint` exit 0 |
| coverage merge unit test | `mise exec -- node --test scripts/__tests__/coverage-merge.test.mjs` exit 0 (3/3 pass) |
| api classification | `vitest list` disjoint check PASS (`api-unit=44`, `api-d1=94`, union=138, intersection=0) |
| api unit coverage | initially exit 1 due Vite SSR transform timeout; same-cycle mitigation added `--maxWorkers=1 --minWorkers=1` to `test:coverage:unit` |
