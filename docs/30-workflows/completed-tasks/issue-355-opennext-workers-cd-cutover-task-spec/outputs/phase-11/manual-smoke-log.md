# Manual Smoke Log

## Status

| Item | Value |
| --- | --- |
| workflow_state | `spec_created` |
| evidence mode | `NON_VISUAL` |
| runtime smoke | `not_run_in_spec_workflow` |
| follow-up owner | implementation follow-up for web CD cutover |

## Planned Smoke Set

| Smoke | Source | Target during implementation follow-up | Current result |
| --- | --- | --- | --- |
| S-01〜S-10 | UT-06 Phase 11 smoke | `https://ubm-hyogo-web-staging.<account>.workers.dev` | pending |
| Web -> API bridge | AC-4 | service binding via `API_SERVICE` | pending |
| rollback readiness | Phase 11 E-5 | staging rollback drill / append-only VERSION_ID evidence | pending |

This file intentionally records readiness only. Runtime PASS must be written by the implementation follow-up after deploy evidence exists.

