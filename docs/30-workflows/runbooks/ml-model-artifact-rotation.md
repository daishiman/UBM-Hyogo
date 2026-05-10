# ML Model Artifact Rotation Runbook

## Scope

This runbook is the operational contract for Issue #587. It does not execute a rotation by itself. It fixes the candidate evaluation, canary, promotion, and rollback steps that a later implementation/runtime cycle must follow after Gate-R0 to Gate-R3 are satisfied.

## Invariants

- Store only 1Password references such as `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE`; never store resolved model paths, token values, raw feature datasets, full IP addresses, full user agents, or actor email values in docs, logs, artifacts, PR bodies, or commit messages.
- Keep D1 classifier metadata columns (`classifier_used`, `classifier_version`, `confidence`) during rollback. Rollback changes the artifact reference or classifier setting, not the schema.
- Use `scripts/cf.sh` for Cloudflare operations. Do not call `wrangler` directly from this workflow.
- Use `Refs #549, #587` for PR and commit context. Do not use `Closes`, `Fixes`, or `Resolves`.

## Gate-R0 To Gate-R3

| Gate | Required evidence | Failure handling |
| --- | --- | --- |
| R0 parent readiness | Issue #549 has completed its runtime boundary or equivalent approval evidence exists | Do not start artifact promotion |
| R1 candidate replay | Candidate offline replay is no worse than baseline for precision / recall proxy | Discard candidate and return to Issue #548 selection |
| R2 runtime guard | fallback rate < 5%, p95 latency <= 1.5x baseline, leakage hits = 0 | Promotion is blocked |
| R3 rollback approval | Previous artifact reference and rollback owner are recorded | Promotion is blocked |

## Candidate Evaluation

1. Read candidate and baseline through op references only.
2. Run the future `artifact-canary.ts` entrypoint in staging with a 1 hour default replay window.
3. Write `outputs/phase-11/evidence/canary-dry-run.json`.
4. Run leakage grep against logs, reports, and candidate metadata. Write `outputs/phase-11/evidence/leakage-grep.log`.
5. Run dataset grep to prove raw feature data was not committed or uploaded. Write `outputs/phase-11/evidence/dataset-grep.log`.

## Promotion

Promotion is a PR that changes the production artifact reference after all gates pass. The PR must include the canary summary, baseline comparison, rollback instruction, and `Refs #549, #587`. The PR must not contain the resolved artifact value.

## Rollback

Rollback is one logical change: restore `CF_AUDIT_ML_MODEL_PATH_PROD` to the previous op-managed value, then confirm the next hourly run records the expected classifier version. If the classifier itself is unstable, fall back to the Issue #549 rule and set `CF_AUDIT_CLASSIFIER=threshold`.

## Evidence Paths

| Evidence | Path |
| --- | --- |
| typecheck | `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/evidence/typecheck.log` |
| lint | `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/evidence/lint.log` |
| focused tests | `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/evidence/test.log` |
| canary result | `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/evidence/canary-dry-run.json` |
| leakage grep | `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/evidence/leakage-grep.log` |
| dataset grep | `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/evidence/dataset-grep.log` |
