# Unassigned Task Detection

## Result

Three follow-up items remain. Two automation gaps were formalized in this wave; DNS cutover remains delegated to UT-16.

| Candidate | status | formalize decision | path / owner | Reason |
| --- | --- | --- | --- | --- |
| Route inventory script | open | formalized | `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md` | Dashboard-only checks are harder to repeat |
| Logpush target diff script | open | formalized | `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` | Manual Logpush inspection is error-prone |
| DNS cutover automation | baseline | delegated | UT-16 | DNS changes are explicitly outside this workflow |

## 0-Secret Rule

No task may require storing secret values in markdown evidence.
