# Dataflow

Refs #549, Refs #586, Refs #656.

`.github/workflows/cf-audit-log-7day-summary.yml` emits versioned 7day summary JSON under the completed parent evidence path. `scripts/cf-audit-log/dashboard/aggregate-weekly.ts` reads versioned summaries and emits weekly trend JSON for the static dashboard.
