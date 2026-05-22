# Skill Feedback Report

## Template Improvement

- Phase 12 strict 7 must be physical files; aggregating sections into `main.md` is not acceptable.
- Artifacts parity must check referenced file existence, not only root/output JSON equality.

## Workflow Improvement

- VISUAL tasks need a local fixture screenshot route before staging is available. Server Component fetches require mock API/server fixture support, not browser `page.route()`.
- `it.todo` a11y placeholders should fail Phase 6 close-out unless formal runtime blockers exist.

## Documentation Improvement

- The task state vocabulary should distinguish `implemented-local-runtime-pending` from `spec_created` as soon as `apps/` or `packages/` implementation files exist in the branch.
