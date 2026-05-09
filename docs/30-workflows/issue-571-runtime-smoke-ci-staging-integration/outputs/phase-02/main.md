# Phase 2 Output: 設計（implementation cycle）

Canonical source: `../../phase-02.md`

## 確定設計

- trigger: `workflow_call` (from `backend-ci.yml`) + `workflow_dispatch`
- environment: `staging-runtime-smoke`
- secret 注入: ADR-runtime-smoke-secret-injection.md（GitHub Environments 採用）
- required check: ADR-runtime-smoke-required-status-check.md（本サイクル optional、30 日 PASS で再評価）
- file inventory: 新規 8 件 / 編集 3 件（backend-ci.yml, ci.yml, runtime-attendance-provider.sh）
- `set -x` 禁止、`::add-mask::` を smoke step より前に 4 件配置（`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER`）
- 検証 grep `workflow_call|workflow_dispatch`, `environment: staging-runtime-smoke`, `ADR-runtime-smoke-*`, `set -x`, `--ci-summary` 全 PASS
