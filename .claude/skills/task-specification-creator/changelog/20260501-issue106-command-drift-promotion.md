# 2026-05-01 issue-106 command drift promotion

- Reflected issue-106 Phase 12 feedback into `task-specification-creator`.
- Added a command contract drift rule: stale candidate commands must be re-resolved from the current repository scripts and synchronized across Phase 1/4/9/11/12 before Phase 12 can PASS.
- Clarified that skill feedback no-op requires scope, no-op reason, and evidence path.
