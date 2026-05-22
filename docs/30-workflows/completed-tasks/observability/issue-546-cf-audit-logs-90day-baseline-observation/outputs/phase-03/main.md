# Phase 3 Output: Observation / Gate Design

Status: `PASS`

## Gate Contract

| Gate | Formula | Runtime Result Source |
| --- | --- | --- |
| Gate-A | 90 day continuous hourly monitor runs and no stale heartbeat gap | `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` + watchdog evidence |
| Gate-B | alert issue count 0, or false positive rate <= 5% with labels present | `outputs/phase-11/gh-issues-cf-audit.json` + D1 summary |
| Gate-C | monthly tuning minutes >= 240 | `outputs/phase-11/tuning-cost-summary.md` |

## Design Decisions

- Gate-A uses `gh api --paginate`, not `gh run list --limit 500`.
- Gate-B may PASS with zero alert issues only when the D1/runtime observation boundary is not blocked.
- Gate-C remains pending when no owner-authored tuning log confirms zero work.

## Handoff

Proceed to Phase 4 with the data contracts fixed.
