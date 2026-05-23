# Documentation Changelog

| Date | Change |
| --- | --- |
| 2026-05-23 | Added strict 7 Phase 12 outputs, root/output `artifacts.json` parity, and aiworkflow requirement ledger entries for Issue #55 workflow formalization. |
| 2026-05-23 | Corrected the implementation contract to use current code paths: `member_status.notification_opt_out`, `MemberDrawer`, `apps/web/src/lib/admin/api.ts`, and migration `0020_notification_channel_and_opt_out.sql`. |
| 2026-05-23 | Added compliance evidence that runtime and PR actions remain user-gated and must not be claimed complete before physical Phase 11 evidence exists. |

## Verification Notes

- `git status --short` and `git diff --stat` must show the workflow files and aiworkflow ledgers as real changes.
- `cmp -s artifacts.json outputs/artifacts.json` is the root/output parity command for this workflow.
- Local test commands were executed in this implementation cycle; production D1 migration apply and staging smoke remain user-gated.
