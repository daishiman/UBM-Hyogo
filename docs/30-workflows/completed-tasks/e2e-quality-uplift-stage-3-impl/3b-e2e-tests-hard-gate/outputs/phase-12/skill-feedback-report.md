# Skill Feedback Report

## Template Improvement

`artifacts.json` phase status vocabulary should be validated against canonical values.

Routing: fixed in this cycle. Root state is now `implemented-local`; Phase 7/11 remain `runtime_pending`; Phase 13 remains blocked pending user approval.

## Workflow Improvement

Implementation specifications with runtime-pending CI evidence must avoid implying local runtime completion.

Server Component E2E specs must not treat `page.route()` as proof for server-side `fetch()` paths. Mock API / seed / `INTERNAL_API_BASE_URL` evidence should be part of Phase 2/4/11.

Routing: fixed in this cycle by adding `scripts/e2e-mock-api.mjs` and wiring `.github/workflows/e2e-tests.yml` to start it before Playwright runs.

## Documentation Improvement

The parent archive path must be used consistently after a workflow is moved to `completed-tasks/`.

Phase 11 canonical evidence should prefer tracked `.txt` / `.md` / `.json`; `.log` files are unsuitable as PASS roots when ignored by repository rules.
