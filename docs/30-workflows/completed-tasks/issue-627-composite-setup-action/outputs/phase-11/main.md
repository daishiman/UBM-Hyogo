# Phase 11 NON_VISUAL Evidence Index

| item | status | evidence |
| --- | --- | --- |
| NON_VISUAL classification | completed | CI infra only; screenshot evidence is not required. |
| local static checks | completed | `.github/actions/setup-project/action.yml` exists, all 7 workflow call sites use it, and `git diff --check` passed locally. |
| GitHub Actions runtime | runtime_pending | Requires user-approved commit / push / draft PR. |
| branch protection drift | runtime_pending | Requires before / after `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` snapshots. |

GitHub Actions runtime evidence is not treated as completed evidence until the user approves commit / push / draft PR execution. Runtime files under `outputs/phase-11/evidence/` must include command, timestamp, and exit code when captured.
