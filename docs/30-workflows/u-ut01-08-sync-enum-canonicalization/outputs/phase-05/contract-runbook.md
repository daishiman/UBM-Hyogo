# Phase 5 Output: Contract Runbook

## Runbook

1. Read `canonical-set-decision.md`.
2. Apply `value-mapping-table.md` ordering when drafting migration work.
3. Keep `trigger_type` mechanism-only.
4. Preserve actor information in `triggered_by`.
5. Import shared types and schemas only after U-UT01-10 lands.

## Downstream Use

| Task | Required input from this workflow |
| --- | --- |
| UT-04 | Canonical CHECK values and conversion order |
| UT-09 | Literal rewrite list and trigger semantics |
| U-UT01-10 | Type and Zod placement decision |

## Stop Conditions

- Do not add `admin` back into `trigger_type`.
- Do not collapse `skipped` into `completed` without a new design review.
- Do not mark U-UT01-08 implemented; it remains `spec_created`.
