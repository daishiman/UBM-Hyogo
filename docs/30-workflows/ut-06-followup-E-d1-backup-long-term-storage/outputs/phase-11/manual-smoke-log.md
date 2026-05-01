# Manual Smoke Log

## Status

- result: `NOT_EXECUTED`
- reason: this wave is `spec_created` / `docs-only`; runtime D1 export, R2 upload, restore rehearsal, and UT-08 alert dispatch require Phase 13 user approval and a separate implementation PR.

## Planned Checks

| ID | Check | Expected runtime evidence |
| --- | --- | --- |
| S-03 | D1 export to R2 daily prefix | redacted command transcript and R2 object metadata |
| S-07 | scheduled run continuity | 7 consecutive successful schedule records |
| S-11 | restore drill | restore rehearsal result under the runtime PR |
| S-15 | empty export accepted | validation log showing warning, not failure |
| S-19 | failure alert | UT-08 alert payload with secret-free trace URL |

No runtime PASS is claimed by this file.
