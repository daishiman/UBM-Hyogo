# U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-D: Candidate Path Lifecycle Automation

## 苦戦箇所

Manual op field edits can lose the previous production artifact reference. Rotation needs a predictable `PROD -> PREVIOUS -> CANDIDATE` lifecycle without exposing resolved values.

## リスクと対策

| リスク | 対策 |
| --- | --- |
| previous artifact reference is overwritten | require pre-promotion snapshot into `CF_AUDIT_ML_MODEL_PATH_PREVIOUS` |
| resolved op value leaks into logs | script must print field names and item names only |
| rollback target is ambiguous | promotion evidence must include the previous field name and timestamp, not the resolved value |

## 検証方法

- Run lifecycle script in dry-run mode and verify name-only output.
- Confirm `PROD`, `PREVIOUS`, and `CANDIDATE` references are all present before promotion.
- Confirm rollback command restores by reference without printing resolved values.

## スコープ

Includes op reference lifecycle scripting and dry-run validation. Excludes production mutation until user approval.

