# 2026-05-09 CI pipeline recovery web CD and runtime smoke

- workflow root: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/`
- state: `implemented-local-runtime-pending / implementation / NON_VISUAL`
- local implementation:
  - `.github/workflows/web-cd.yml` now uses OpenNext Workers build and `scripts/cf.sh deploy`
  - task-01 aligned web-cd deploy token reference to environment-scoped `secrets.CLOUDFLARE_API_TOKEN` and originally added `Verify CF token is present` to staging/production jobs; Issue #640 supersedes the verification shape by moving token presence validation into the deploy step and keeping `CLOUDFLARE_API_TOKEN` step-scoped
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

## 2026-05-10 update (task-01 implementation reflection)

- 反映元: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/` Phase 12 outputs（local 実装完了 / runtime CI 待ち）
- skill 追記:
  - `references/lessons-learned-ci-pipeline-recovery-2026-05.md` に L-CIPR-007（web-cd は environment-scoped `CLOUDFLARE_API_TOKEN` を正本にする rationale）と L-CIPR-008（GitHub Environment 名と wrangler `--env` 値の文字列一致ルール）を追加
  - 同 lessons file に L-CIPR-009（task-02 readiness gate は smoke script を変えず workflow 内 name-only pre-check で elegant に gate する pattern）と L-CIPR-010（parent workflow 同期で task-01 / task-02 を逐語併記し Phase 12 strict 7 outputs を task root へ複製・`cmp -s` parity を固定する rule）を追加
- task-02 状態: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/` を `implemented-local-runtime-pending / implementation / NON_VISUAL` として同期。`.github/workflows/runtime-smoke-staging.yml` は smoke 実行前に `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` を name-only early-fail し、Phase 12 strict 7 outputs を追加済み。
- 後続 user-gated operation:
  - task-01 / task-02 の runtime CI evidence 取得（secret 投入 → workflow run → AC 確認）
  - `deployment-secrets-management.md` の 500 行超過解消（rotation / 1Password sync の責務分離）
