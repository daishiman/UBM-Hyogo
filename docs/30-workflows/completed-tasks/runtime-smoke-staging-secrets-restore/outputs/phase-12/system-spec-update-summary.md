# System Spec Update Summary

## Step 1-A: Task Record

`runtime-smoke-staging-secrets-restore` は `implementation / NON_VISUAL / implemented_local_evidence_captured`。変更対象は `scripts/ci/verify-env-secrets.sh`、`scripts/ci/verify-env-secrets.allowlist`、`scripts/ci/__tests__/verify-env-secrets.spec.sh`、および本 workflow 仕様書。

## Step 1-B: State

| Field | Value |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| verdict | `runtime_pending (secret mutation and workflow rerun user-gated)` |
| Phase 11 | `runtime_pending` |
| Phase 12 | `completed` |

## Step 1-C: Related Task Boundary

`ci-env-secret-inventory-and-preflight-gate` は全体 inventory の正本。本タスクは `staging-runtime-smoke` 必須 4 件の allowlist contract と test coverage を追加する派生差分で、重複 root ではない。

## Step 1-D: aiworkflow Same-wave Sync

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | runtime-smoke-staging-secrets-restore lookup row を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 即時参照セクションを追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow row を追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `env=...;required=...` を mute ではなく Environment 必須 contract として明記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | `verify-env-secrets.yml` current facts に env-required contract / repository fallback 禁止境界を追加 |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-ci-env-secret-inventory-and-preflight-gate-2026-05.md` | `name=...` mute と `env=...;required=...` required contract の境界を追記 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴へ runtime-smoke-staging-secrets-restore を追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260516-runtime-smoke-staging-secrets-restore.md` | 同期履歴を追加 |

## Step 2: System Spec

aiworkflow-requirements の `deployment-secrets-management.md` は `staging-runtime-smoke` の 5 secret と user-gated 境界を既に持っていたが、今回 `verify-env-secrets.allowlist` の `env=...;required=...` を必須 contract として使うため本文更新が必要だった。`name=...` は短期 mute、`env=...;required=...` は Environment scope 必須 secret contract と分離し、Repository-scoped secret では満たさない境界を同一 wave で反映した。
