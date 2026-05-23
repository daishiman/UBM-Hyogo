# 2026-05-12 Issue #627 composite setup action

- Registered `docs/30-workflows/issue-627-composite-setup-action/` as `implemented_local_runtime_pending / implementation / NON_VISUAL / CI infra`.
- Canonicalized and implemented the checkout boundary: `.github/actions/setup-project/action.yml` is checkout-less and owns Node / pnpm or mise setup plus optional install.
- Canonicalized input vocabulary to `setup-strategy`.
- Preserved required status contexts: `ci`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate`, `build-test`, `workflow-shell-lint`.
- Separated workflow lint from composite action validation: actionlint targets workflow YAML files only; the composite action is checked by structure / SHA pin assertions.
- Applied Closed Issue Reference Rule: Issue #627 is CLOSED, so PR text must use `Refs #627` only.
- Captured lessons in `lessons-learned/lessons-learned-issue-627-composite-setup-action-2026-05.md` (L-627-001 input vocabulary drift, L-627-002 checkout-less caller-owned boundary, L-627-003 Phase 11→12 strict 7 skeleton).
- Mirrored the SKILL.md v2026.05.13-issue627 row into `SKILL-changelog.md` to keep the full-history index in sync with the top-3 latest list.
