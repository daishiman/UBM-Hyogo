# Unassigned Task Detection

## Summary

New unassigned tasks: 0.

## Existing Follow-up Consumption

| Source | Status | Consumed By |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/UT-06B-MAGIC-LINK-RETRY-AFTER.md` | consumed | `docs/30-workflows/issue-275-magic-link-429-retry-after/` |

## Reviewed Candidates

| Candidate | Decision | Reason |
| --- | --- | --- |
| reload を跨いだ cooldown 永続化 | not created | AC-3 scope out |
| `Retry-After` parser 共通 util 化 | not created | callsite 1 件。抽象化は時期尚早 |
| real API/browser 429 smoke | not created | user-gated runtime confirmation として Phase 13/PR test plan に残す |
