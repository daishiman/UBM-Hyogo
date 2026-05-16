# Phase 13: PR 作成（PENDING）

## ステータス

**PENDING — user の明示承認後のみ実施**。AI による自律的な commit / push / PR 作成は禁止（CONST_002）。

## PR メタ案

- base: `dev`
- title: `fix(ci): provision staging-runtime-smoke secrets and add workflow doc-ref guard`
- 含む変更:
  - `.github/workflows/runtime-smoke-staging.yml`（path 修正）
  - `.github/workflows/{ci,incident-runbook-slack-delivery,pr-build-test,pr-target-safety-gate,verify-indexes,verify-test-suffix}.yml`（stale path 同期）
  - `.github/workflows/verify-workflow-doc-refs.yml`（新規 CI guard）
  - `scripts/ci/verify-workflow-doc-refs.sh`（新規 guard script）
  - `scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh`（新規 test suite）
  - `docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/**`（仕様書 + outputs）
  - `.claude/skills/aiworkflow-requirements/**`（changelog + indexes / references 更新）

## PR body 雛形

`outputs/phase-12/implementation-guide.md` を本体として、Test plan は `outputs/phase-9/qa-result.md` に基づき構成する。

## 注意

- secret 実値・bearer・webhook URL を PR body / commit message / diff に絶対に貼らない
- secret 投入は user 操作のため PR diff には含まれない
