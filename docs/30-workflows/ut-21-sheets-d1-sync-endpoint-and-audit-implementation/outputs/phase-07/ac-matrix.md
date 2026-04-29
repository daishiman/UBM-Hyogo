# Acceptance Criteria Matrix

| AC | Result | Note |
| --- | --- | --- |
| AC-1 runSync core | BLOCKED | Sheets-oriented core is not current canonical |
| AC-2 `/admin/sync*` routes | PARTIAL | `/admin/sync/responses` exists as Forms sync route |
| AC-3 Cron separation | DEFERRED | Belongs to 09b |
| AC-4 Bearer guard | VALID REQUIREMENT | Keep for current endpoints |
| AC-5 idempotency | VALID REQUIREMENT | Apply to Forms response sync |
| AC-6 audit outbox | BLOCKED | Needs `sync_jobs` gap analysis |
| AC-7 contract sync | FAIL | UT-21 conflicts with current canonical |
| AC-8 smoke | NOT RUN | Phase 11 outputs are placeholders |
| AC-9 Workers crypto | DEFERRED | Sheets-specific |
| AC-10 exactOptionalPropertyTypes | VALID ENGINEERING RULE | Keep where applicable |
| AC-11 secrets | RECHECK | Current env names differ |
| AC-12 4 conditions | FAIL | Conflict detected |
