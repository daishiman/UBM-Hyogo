# Documentation Changelog

| Date | Change | Files |
| --- | --- | --- |
| 2026-05-10 | Restored task-02 canonical child path under the CI pipeline recovery workflow, added Phase 12 strict outputs, and synchronized aiworkflow-requirements indexes. | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/outputs/phase-12/*` |
| 2026-05-10 | Added runtime smoke staging secret readiness pre-check before credential masking and smoke execution. | `.github/workflows/runtime-smoke-staging.yml` |
| 2026-05-10 | Normalized Phase status vocabulary: root `workflow_state=implemented-local-runtime-pending`; Phase 1-10/12 `completed`; Phase 11 `static-completed/runtime-pending`; Phase 13 `pending`. | `artifacts.json`, `index.md` |
| 2026-05-10 | Split Phase 11 into static evidence captured and runtime evidence pending; added root/output artifacts parity. | `artifacts.json`, `outputs/artifacts.json`, `outputs/phase-11/evidence/*` |
