# Skill Feedback Report

## Template Improvements

- Promoted runtime smoke 500 body-first RCA into `task-specification-creator/references/phase-template-core.md`.

## Workflow Improvements

- `secret list` must not be treated as value-presence proof. Recovery runbooks should use user-approved `op read ... | bash scripts/cf.sh secret put ...` plus runtime curl.
- Smoke runners that persist non-200 bodies should classify known auth/config bodies before exiting.

## Documentation Improvements

- Misdiagnosis workflows should keep lessons in their original root and register the true root-cause workflow through aiworkflow indexes and artifact inventory.

