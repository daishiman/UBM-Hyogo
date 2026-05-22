# Skill Feedback Report

## Template Improvement

HOLD / schedule-stop tasks should have a dedicated mini-template:

- pre-merge static proof: workflow path exists, schedule removed, default safe input set
- post-merge runtime proof: schedule run absence after a tick
- retained asset list: scripts / schema / secrets kept for manual path

## Workflow Improvement

Phase 11 post-merge evidence must not be a Phase 13 prerequisite. Use `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` until merge plus observation.

## Documentation Improvement

Runbook archive policy is now documented in `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`: HOLD / restart runbooks move to `docs/30-workflows/runbooks/_archive/` only after the target workflow is restarted or permanently retired and active spec/index references are updated in the same wave.
