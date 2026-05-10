# Documentation Changelog

| Date | Change |
| --- | --- |
| 2026-05-09 | Created Issue #581 canonical workflow package for Issue #546 90 day re-observation reminder. |
| 2026-05-09 | Added root and output `artifacts.json` with `spec_created` root state and `observation_continue` runtime decision state. |
| 2026-05-09 | Corrected Phase 12 strict 7 outputs to match task-specification-creator. |
| 2026-05-09 | Corrected watchdog handling to Issue #518 HOLD lifecycle marker instead of non-existent workflow API. |
| 2026-05-09 | Updated existing unassigned reminder to pointer to canonical Issue #581 workflow. |
| 2026-05-09 | Promoted HOLD lifecycle marker and P-1 early termination feedback into task-specification-creator. |
| 2026-05-09 | Corrected Phase 13 stage scope to include aiworkflow-requirements sync files and pointer reminder. |
| 2026-05-09 | Changed the source reminder status to `promoted_to_canonical_pointer`. |
| 2026-05-09 | Repointed FU-03-D production classifier switch prerequisites to Issue #581 canonical re-observation and Issue #548 SSOT references. |

## Verification Commands

```bash
find docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder -maxdepth 3 -type f | sort
pnpm indexes:rebuild
```
