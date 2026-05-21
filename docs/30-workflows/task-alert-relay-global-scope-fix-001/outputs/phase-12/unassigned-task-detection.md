# Phase 12: Unassigned Task Detection

## Result

One independent structural follow-up is registered in this cycle.

## Decisions

| Candidate | Decision | Reason |
| --- | --- | --- |
| `apps/api/src/**/*.ts` global scope sweep | in-cycle verification | Required by FUT-1 and completed through grep gate; not backlog material |
| ESLint custom rule for Workers global scope forbidden APIs | no task created | Independent tooling design not needed to unblock PR #505 deploy validation; existing focused regression test covers this route |
| aiworkflow 500-line reference split | created | `validate-structure.js` exits 0 but warns on five existing overlong references. Splitting them is a cross-reference reclassification task independent of the alert-relay deploy blocker. Registered at `docs/30-workflows/unassigned-task/aiworkflow-reference-500-line-split-001.md` |
