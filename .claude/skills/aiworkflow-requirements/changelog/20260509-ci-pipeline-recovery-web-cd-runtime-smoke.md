# 2026-05-09 CI pipeline recovery web CD and runtime smoke

- workflow root: `docs/30-workflows/ci-pipeline-recovery-web-cd-and-runtime-smoke/`
- state: `implemented-local-runtime-pending / implementation / NON_VISUAL`
- local implementation:
  - `.github/workflows/web-cd.yml` now uses OpenNext Workers build and `scripts/cf.sh deploy`
  - `.github/workflows/runtime-smoke-staging.yml` guards Slack failure posting on `ci-evidence/summary.json`
  - `scripts/smoke/provision-staging-secrets.sh` provides redacted, idempotent GitHub Environment secret provisioning
- aiworkflow sync:
  - `deployment-gha.md`, `deployment-cloudflare.md`, `deployment-secrets-management.md`
  - `task-workflow-active.md`, `quick-reference.md`
  - Issue #571 Phase 11 G1 runbook
- user-gated:
  - secret placement, deploy run, runtime smoke, Slack failure injection, commit, push, PR
- skill feedback follow-up (Phase 12 skill-feedback-report):
  - `task-workflow-active.md` に Issue #571 G1 wording `prepared-local / pending user approval` を固定（name-only inventory と runtime smoke evidence 取得まで前進語彙へ昇格させない）
