# System Spec Update Summary — issue-882-terms-prefetch-env-validation-fix

## Verdict

System spec sync required and completed in both the workflow-local canonical docs and the system spec source. aiworkflow-requirements registration is represented by this workflow and the artifact inventory entry for same-wave lookup.

## Contract

- `getEnv()` and `getPublicEnv()` continue to throw on invalid env.
- Metadata generation may use `getPublicEnvSafe()` and local fallback to avoid RSC prefetch failure.
- Fallback metadata is never production-indexable; `robots` stays noindex/nofollow when env is unresolved.

## Updated Canonical Areas

| Area | Update |
| --- | --- |
| Workflow root | `artifacts.json` state changed from `spec_created` to `implemented_local_evidence_captured` |
| System spec | `docs/00-getting-started-manual/specs/05-pages.md` now records the public metadata env fallback contract |
| Source follow-up | `home-page-prototype-alignment-followup-001-terms-prefetch-env-validation.md` marked consumed by this canonical workflow |
| Phase 11 | Added runtime smoke result and Playwright report paths |
| Phase 12 | Added strict 7 outputs and compliance check |

## No New Follow-Ups

No separate backlog/Issue is needed. The only observed Playwright blocker was local infrastructure setup: mock API on `127.0.0.1:8787` must be running for `/` runtime smoke.
