# Unassigned Task Detection

Detected count: 1

## U-FIX-CF-ACCT-01-DERIV-04-FU-03-D

Created stub: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-production-classifier-switch.md`

Reason: production `CF_AUDIT_CLASSIFIER` switch requires FU-03-B redacted 90-day dataset replay, winner confirmation, rollback rehearsal, and explicit user approval. Executing it in this spec-sync wave would incorrectly claim runtime evidence.

Implementation timing: after FU-03-B production-equivalent redacted dataset replay produces a production-dataset comparison report with a non-threshold winner.

Management location: `docs/30-workflows/unassigned-task/`.
