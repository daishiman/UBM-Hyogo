# Skill Feedback Report

## テンプレ改善

No task-specification-creator template change is required. Existing rules already
covered the failures: Phase 12 strict 7, 3-state vocabulary, same-wave sync, and
runtime/user-gated boundary wording.

## ワークフロー改善

Applied in this cycle: workflow YAML files now have a dedicated guard for
repository-local `docs/...md` references. Generated runtime evidence under
`outputs/phase-11/evidence/` is explicitly out of scope because the workflow run
creates it.

## ドキュメント改善

Applied in this cycle: the staging runtime smoke secret-management contract now
keeps the five-secret provisioning inventory separate from the four-secret
workflow early-fail boundary.

## Routing

| Item | Route | Evidence |
| --- | --- | --- |
| Phase 12 strict 7 missing | fixed in workflow files | `outputs/phase-12/*` |
| State vocabulary drift | fixed in workflow artifacts | `artifacts.json`, `index.md`, compliance check |
| `SLACK_WEBHOOK_INCIDENT` boundary | fixed in docs | `implementation-guide.md`, `system-spec-update-summary.md` |
| workflow doc reference drift | fixed in code and CI | `scripts/ci/verify-workflow-doc-refs.sh`, `.github/workflows/verify-workflow-doc-refs.yml` |
