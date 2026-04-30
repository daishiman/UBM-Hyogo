# Phase 6 Output: Failure Cases

| Failure | Cause | Prevention |
| --- | --- | --- |
| Migration rejects existing rows | CHECK added before value conversion | Convert first, then add CHECK |
| Metrics show success count as zero | Readers still check `success` after writers emit `completed` | UT-09 grep and rewrite |
| Manual runs lose actor data | `admin` replaced by `manual` without `triggered_by` | Add `triggered_by` migration and writer change |
| UI shows unknown gray status | UI labels do not know canonical values | Delegate label audit |
| Shared schema drift | types and Zod are implemented separately | U-UT01-10 owns paired implementation |

## Scope Guard

U-UT01-08 records the failures and owner routing only. It does not execute the fixes.
