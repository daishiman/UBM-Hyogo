# Phase 11 smoke log

## Environment

| Field | Value |
| --- | --- |
| Date | 2026-05-17 |
| Worktree | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260517-084759-wt-16` |
| visualEvidence | NON_VISUAL |

## SM1: actionlint all workflows

Command:

```bash
./actionlint -color .github/workflows/*.yml
```

Result: exit 0.

Notes: first run exposed existing shellcheck issues in 6 workflow files. They were fixed in the same cycle:

- `.github/workflows/cf-audit-log-7day-summary.yml`
- `.github/workflows/cf-audit-log-monitor.yml`
- `.github/workflows/cf-token-rotation-reminder.yml`
- `.github/workflows/lighthouse.yml`
- `.github/workflows/release-create.yml`
- `.github/workflows/validate-build.yml`

## SM2: local reproduction command

Command:

```bash
pnpm observation:lint
```

Result: exit 0.

Observed summary:

```text
PASS: TC-03 normal day
PASS: TC-04 D+7 trigger
PASS: TC-04 offset=7
PASS: TC-05 D+30 trigger
PASS: TC-05 offset=30
PASS: TC-06 dispatch override
PASS: TC-06 dispatch override offset
PASS: TC-06 dispatch override target date
PASS: TC-07 invalid offset
PASS: TC-07b latest release fallback
PASS: TC-07b latest release date
PASS: TC-08 placeholders all replaced
PASS: TC-08 title rendered
----- result: PASS=13 FAIL=0 -----
```

## SM3: artifact and required file checks

Commands:

```bash
cmp -s docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/artifacts.json docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/artifacts.json
find docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/phase-12 -maxdepth 1 -type f | sort
test -f docs/30-workflows/runbooks/workflow-lint-local-recovery.md
test -f docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/phase-02/yamllint-decision.md
```

Results:

```text
artifacts_cmp_exit=0
runbook_exit=0
decision_exit=0
phase-12 strict 7 files present
```

## SM4: GitHub Actions runtime evidence

Command:

```bash
gh pr checks <PR_NUMBER> --watch
```

Result: `runtime_pending (pending_user_approval)`.

Reason: this workflow cannot collect real GitHub Actions runtime evidence until the user approves commit, push, and PR creation. This is not a new unassigned task; it is Phase 13 evidence for the same workflow.

## SM5: intentional failure-injection boundary

Command:

```bash
tmpdir=$(mktemp -d)
cp .github/workflows/ci.yml "$tmpdir/bad.yml"
printf '\n  invalid-actionlint-fixture: [\n' >> "$tmpdir/bad.yml"
./actionlint -color "$tmpdir/bad.yml"
```

Result: `runtime_pending (documented boundary)`.

Reason: the lint tool's failure mode is already covered by actionlint itself; this task did not mutate the repository with a failing fixture. The canonical close-out evidence is the all-workflows clean run plus `pnpm observation:lint` exit 0. If a future PR needs a tracked fixture, it must add one under a dedicated test fixture path and keep it out of `.github/workflows/*.yml`.

## SM6: canonical Phase 11 evidence manifest

Command:

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js --workflow docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate --check-existence
```

Result: `completed (manifest added; exit code recorded in Phase 12 compliance after re-run)`.

## Runtime boundary

GitHub Actions runtime evidence, commit, push, PR, and branch protection changes are pending user approval.
