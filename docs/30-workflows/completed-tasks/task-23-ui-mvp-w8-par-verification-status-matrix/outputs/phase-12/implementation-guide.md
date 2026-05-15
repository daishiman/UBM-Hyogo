# Implementation Guide

## Part 1: Concept For Middle School Students

This task prepares a checklist table.

Imagine 22 students each take 4 small tests. The teacher wants one table with 88 boxes, so anyone can see which boxes are OK, which need attention, and which do not apply.

Here:

| Example | This Task |
| --- | --- |
| 22 students | task-01 through task-22 |
| 4 tests | no contradiction, no missing items, consistent naming, dependency alignment |
| 88 boxes | `VERIFICATION-STATUS.md` |

This cycle creates that table and records the checks that prove all 88 boxes are filled.

## Part 2: Technical Details

Target output:

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md`

Row model:

```typescript
type Verdict = "PASS" | "WARN" | "FAIL" | "N/A";

interface VerificationRow {
  taskId: `task-${string}`;
  subject: string;
  c1NoContradiction: Verdict;
  c2NoMissingItems: Verdict;
  c3Consistency: Verdict;
  c4DependencyAlignment: Verdict;
  remarks?: string;
}
```

Rules:

| Rule | Contract |
| --- | --- |
| row count | 22 rows |
| condition cells | 88 cells |
| warning/failure reason | required |
| parent workflow path | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` |
| current workflow state | `implemented_local_evidence_captured` |
| generated deliverable | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md` |
