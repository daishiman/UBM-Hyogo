# Skill feedback report

## task-specification-creator

- Promoted in this cycle: add a judgement gate for GitHub Actions `environment:` usage. Read-only monitoring jobs should not inherit deploy environment protection unless the task explicitly accepts branch-policy blocking.
- Promoted in this cycle: if Phase 11 lists user-gated runtime evidence files, create placeholder files for each declared path and mark them `PENDING_USER_GATE`; do not leave manifest-only evidence.
- Keep `implemented_local_runtime_pending` distinct from `completed` when local code is changed but push/runtime evidence is user-gated.
- Require root/output `artifacts.json` parity for new workflow specs before Phase 12 close-out.

## aiworkflow-requirements

- Runbook specs should explicitly separate monitoring credentials from deploy credentials.
- Repository-level secret mirroring is acceptable only for read-only or notification credentials and must be documented as a widened access boundary.

## automation-30

Compact 30-method evidence is enough for a narrow NON_VISUAL workflow fix, provided the concrete fixes are applied to real files and the four-condition gate is explicit.
