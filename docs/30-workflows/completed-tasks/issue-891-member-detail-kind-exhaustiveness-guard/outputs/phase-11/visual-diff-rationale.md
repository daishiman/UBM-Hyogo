# Visual Diff Rationale

No visual baseline update was performed in this cycle.

The code change is `NON_VISUAL` at the evidence boundary: it changes the adapter classification contract and is covered by unit tests.
If a future authenticated/public visual run shows `url` moving from detail rows to the links section, or removed detail rows for `consent` / `system` / `unknown`, that diff is intentional because those kinds are no longer `detail` route fields.

Review cycle note (2026-05-25): `public-flow.spec.ts` desktop screenshot smoke was attempted with `PLAYWRIGHT_EVIDENCE_DIR` pointed at this workflow, but it failed before member detail navigation on an existing landing-page axe violation (`scrollable-region-focusable` on `<pre>`). The failed transient artifacts were removed from this workflow evidence directory and are not counted as Phase 11 pass evidence.
