# Refactor Table

Refs #549, Refs #586, Refs #656.

| Area | Decision |
| --- | --- |
| ISO week | Extracted `toIsoWeek` from observation monitor for reuse. |
| Dashboard route | Kept static HTML outside `apps/web`. |
| Runtime data | Kept production/staging evidence user-gated. |
