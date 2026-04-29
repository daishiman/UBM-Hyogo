# Contract Sync Check

| Contract | UT-21 | Current Canonical | Result |
| --- | --- | --- | --- |
| Source API | Google Sheets | Google Forms | FAIL |
| Manual endpoint | `POST /admin/sync` | `POST /admin/sync/schema`, `POST /admin/sync/responses` | FAIL |
| Ledger | `sync_audit_logs`, `sync_audit_outbox` | `sync_jobs` | FAIL |
| Auth | `SYNC_ADMIN_TOKEN` Bearer | `SYNC_ADMIN_TOKEN` Bearer | PASS |

## Conclusion

Contract sync fails. UT-21 must be reconciled before implementation close-out.
