# Failure Cases

| Case | Risk | Handling |
| --- | --- | --- |
| Sheets and Forms sync both treated as canonical | Divergent data model | Block UT-21 close-out |
| `sync_audit_logs` added beside `sync_jobs` without decision | Duplicate ledger | Require audit gap analysis |
| Phase 11 placeholder treated as smoke evidence | False release confidence | Mark smoke as not executed |
| Phase 12 Step 2 blindly updates specs | Corrupt canonical docs | Use conflict-detected branch |
