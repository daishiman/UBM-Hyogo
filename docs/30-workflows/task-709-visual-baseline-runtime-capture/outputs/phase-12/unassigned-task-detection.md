# Unassigned Task Detection

## Summary

One new follow-up is formalized because completing it in this cycle would require a separate governance mutation (`gh api -X PUT`) against dev/main branch protection. That operation must have its own read-only evidence, user approval marker, and rollback boundary.

## Detected Follow-Up

| ID | Task | Reason | Location |
| --- | --- | --- | --- |
| TASK-709-FU-BRANCH-PROTECTION | Add `playwright-visual-full` jobs to dev/main required checks | Governance mutation requires separate approval cycle after 51 baselines and green runtime evidence exist | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` |

## Existing Related Follow-Ups

| Task | Handling |
| --- | --- |
| error boundary deterministic fixture | Existing task; not duplicated |
| loading state deterministic fixture | Existing task; not duplicated |

No TODO comment is used as a substitute for formalization.
