# System Spec Update Summary

Verified / updated in this cycle:

- `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- Existing aiworkflow changelog / LOGS entries already point at the canonical Stage 3 family root; no duplicate history entry is required for this correction.

State after review fixes:

- `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING`
- PR trigger scope is `dev` and `main`, matching downstream branch protection context scope.
- `scripts/e2e-mock-api.mjs` is the deterministic CI fixture for Server Component `fetch()` paths through `INTERNAL_API_BASE_URL` / `PUBLIC_API_BASE_URL`.
