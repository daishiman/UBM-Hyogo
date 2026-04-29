# Phase 11 Manual Smoke Log Template

## 1. check-runs Context Names

Command:

```bash
RECENT_SHA="f4fb3ba6d018075db0e2292542c90a899d3c2dd7"
gh api "repos/daishiman/UBM-Hyogo/commits/${RECENT_SHA}/check-runs" \
  --jq '.check_runs[] | {name: .name, status: .status, conclusion: .conclusion, app: .app.slug}'
```

Result: evidence recorded in `outputs/phase-08/confirmed-contexts.yml`. Required rollout phase 1 contexts are `ci`, `Validate Build`, and `verify-indexes-up-to-date`; all have success evidence. Re-run the command immediately before UT-GOV-001 apply because GitHub check-run retention and main movement can change the observed set.

## 2. PR Checks Text Record

Result: text-only verification is sufficient for this NON_VISUAL task. No screenshot is required. UT-GOV-001 should repeat the PR Checks tab comparison immediately before applying branch protection.

## 3. Optional dev Branch Trial Apply

Status: not executed in UT-GOV-004. This step requires UT-GOV-001 user approval because it changes branch protection.

## 4. Optional Trial PR Checks

Status: not executed in UT-GOV-004.

## 5. Waiting State Check

Status: no waiting-state evidence is expected until UT-GOV-001 performs an approved trial/apply. If `Expected - Waiting for status to be reported` appears after apply, remove only the offending context from `required_status_checks.contexts`; do not clear the entire array.

## 6. Rollback Log

Status: not applicable unless optional trial apply is approved and executed.
