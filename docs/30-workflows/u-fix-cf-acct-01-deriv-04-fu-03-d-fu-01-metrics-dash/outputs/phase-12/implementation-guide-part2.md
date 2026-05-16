# Implementation Guide Part 2

Refs #549, Refs #586, Refs #656.

## Technical Contract

`aggregate-weekly.ts` accepts a directory of `hourly-run-7day-summary.json` files and emits a trend JSON with weekly rows.

```ts
export interface AggregateOptions {
  inputDir: string;
  outFile: string;
  weeks?: number;
  baselineFile?: string;
}
```

## Schema Behavior

| Input | Behavior |
| --- | --- |
| `schema_version: "1.0.0"` with `week_starting` | accept |
| `schema_version: "1.0.0"` without `week_starting` | derive ISO week from `generated_at` using native `Date` |
| missing `schema_version` | warn + skip |
| explicit unsupported version such as `"2.0.0"` | throw |
| non-string `schema_version` | throw |

## Visualization

The selected rendering layer is static HTML:

`docs/dashboards/cf-audit-log-7day-trend/index.html`

No admin UI route is created in this cycle.
