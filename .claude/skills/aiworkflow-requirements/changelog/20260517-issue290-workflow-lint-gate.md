# 2026-05-17 - Issue #290 workflow lint gate

## Summary

- `.github/workflows/ci.yml` の `workflow-shell-lint` actionlint を version `1.7.7` + `.github/workflows/*.yml` glob に変更。
- `package.json` の `observation:lint` を同じ version / glob scope に同期。
- 全件 actionlint で露出した既存 workflow shellcheck 指摘を 6 workflow で最小修正。
- `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` と yamllint 不採用 decision を追加。
- `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/` を `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として Phase 12 strict 7 / artifacts parity まで同期。
- source unassigned `ut-cicd-drift-impl-workflow-lint-gate.md` を consumed に更新。

## Boundary

GitHub Actions runtime evidence、commit、push、PR、branch protection required context 変更は user approval 後。
