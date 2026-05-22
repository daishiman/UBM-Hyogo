# Documentation Changelog

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-526-ci-actionlint-shellcheck-gate |
| date | 2026-05-08 |

## Current / Baseline

| Item | Baseline | Current |
| --- | --- | --- |
| source unassigned | pre-consumed | `consumed / implemented-local / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| root workflow | absent | `docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/` |
| CI gate | absent from Issue #350 files | `workflow-shell-lint` + required `ci` job path |
| local lint | shell-only partial plan | `pnpm observation:lint` includes shellcheck + actionlint |

## Changes

- Issue #526 workflow root を `implemented-local` に更新。
- Phase 1-13 に validator-required skeleton を追加。
- Phase 11 evidence path を作成。
- Phase 1-11 の `outputs/phase-XX/main.md` を追加。
- Root `artifacts.json` と `outputs/artifacts.json` を full mirror にした。
- Phase 12 strict 7 outputs を作成し、review feedback に基づき内容を補強。
- `.github/workflows/ci.yml` の既存 `$GITHUB_OUTPUT` redirect を quote し、actionlint の shellcheck analysis を通過させた。
- `.github/workflows/ci.yml` の `ci` required context path に `pnpm observation:lint` を追加。
- `package.json` の `observation:lint` を shellcheck + actionlint の local 再現コマンドに更新。
- `scripts/observation/test/test-create-reminder-issue.sh` を heredoc 化し、test script も shellcheck clean にした。
- Source unassigned task に consumed trace と consumed status を追加。
- aiworkflow-requirements references / indexes / changelog / active workflow guide / SKILL.md を同期。

## Validator / Evidence

| Check | Evidence | Result |
| --- | --- | --- |
| `pnpm observation:lint` | terminal rerun / Phase 11 evidence refresh target | PASS |
| actionlint current workflows | package script includes both target workflows | PASS |
| shellcheck current scripts | package script includes production + test scripts | PASS |
| artifacts parity | `cmp -s root artifacts outputs/artifacts` | PASS |
| stale wording scan | review feedback grep after correction | PASS target |
| git diff | `git diff --stat` | real code + docs + skill changes present |

## Canonical Paths

| Item | Path |
| --- | --- |
| workflow root | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-065800-wt-3/docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/` |
| implementation guide | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-065800-wt-3/docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/outputs/phase-12/implementation-guide.md` |
| changelog | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-065800-wt-3/.claude/skills/aiworkflow-requirements/changelog/20260508-issue526-ci-actionlint-shellcheck-gate.md` |
| aiworkflow history ledger | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-065800-wt-3/.claude/skills/aiworkflow-requirements/changelog/20260508-issue526-ci-actionlint-shellcheck-gate.md` |
| aiworkflow LOGS.md | N/A: `.claude/skills/aiworkflow-requirements/LOGS.md` does not exist in current layout; dated changelog + SKILL.md row are the history entry |
| task-specification-creator history ledger | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-065800-wt-3/.claude/skills/task-specification-creator/SKILL-changelog.md` |
