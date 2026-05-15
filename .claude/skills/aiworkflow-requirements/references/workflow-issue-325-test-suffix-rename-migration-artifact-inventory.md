# Artifact Inventory: Issue #325 Test Suffix Rename Migration

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/` |
| state | `implementation_completed / implementation / NON_VISUAL / Phase 11 evidence captured / Phase 12 strict 7 files present / Phase 13 pending_user_approval` |
| predecessor | `docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md` |
| parent workflow | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` |
| target | `apps/api/src/**/*.test.ts` 132 files renamed to suffix-classified `*.spec.ts` |
| classification | contract=41 / authz=4 / repository=38 / unit=49 |
| ADR | `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` |
| Phase 11 evidence | `outputs/phase-11/main.md`, `rename-mapping.csv`, `test-count-before.txt`, `test-count-after.txt`, `glob-coverage-grep.log`; api test/typecheck/lint recorded PASS |
| Phase 12 strict 7 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| scope out | `apps/web/**` and `packages/**` test suffix rename are parent responsibility out of scope and are not newly formalized here |

## Invariants

- `routes/auth/session-resolve.test.ts` is classified as contract, not authz.
- Issue #325 is CLOSED; PR text must use `Refs #325` and must not use `Closes #325`.
- Existing `apps/api/src/**/*.test.ts` files are no longer present after the implementation phase; current tree has 132 `apps/api/src/**/*.spec.ts` files.
