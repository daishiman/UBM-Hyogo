# Phase 9 Output: Drift Check

## Status

Pre-approval expected-value check only. Actual GitHub GET comparison is intentionally not executed while this workflow is `spec_created`; it must run in Phase 13 after explicit user approval.

## Six-Value Governance Check

| Value | Expected |
| --- | --- |
| `required_pull_request_reviews` | `null` |
| `enforce_admins` | `true` |
| `allow_force_pushes` | `false` |
| `allow_deletions` | `false` |
| `required_linear_history` | `true` |
| `required_conversation_resolution` | `true` |

Phase 13 must compare GitHub GET output with CLAUDE.md and deployment branch strategy references. Drift is not fixed inline; it is recorded and handed off to `task-utgov001-drift-fix-001` only if actual drift is detected.
