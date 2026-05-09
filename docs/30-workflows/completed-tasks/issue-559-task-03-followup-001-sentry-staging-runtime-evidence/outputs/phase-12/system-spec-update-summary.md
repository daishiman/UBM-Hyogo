# System Spec Update Summary

## This cycle (2026-05-08 / wt-13, post-rebase to origin/dev `7d27f796`)

### Created (untracked, working-tree)

- `outputs/phase-11/main.md` — G0〜G5 結果と halt verdict
- `outputs/phase-11/evidence/preflight-g0.log`
- `outputs/phase-11/evidence/grep-gate-runtime.log`
- `outputs/phase-11/evidence/dsn-leak-scan.log`
- `docs/30-workflows/unassigned-task/task-issue-559-sentry-project-1password-dsn-provisioning-001.md` — G1 前提の外部 SaaS provisioning 未タスク

### Updated (untracked, working-tree)

- `outputs/phase-12/main.md` — Verdict / This cycle / Deferred セクション再構築
- `outputs/phase-12/implementation-guide.md` — Part 3「本サイクル到達点」追記
- `phase-05.md` — OpenNext grep gate scope を `apps/web/.open-next/worker.js` に限定し、1Password provisioning preflight を G1 前に追加
- `phase-11.md` — 2026-05-08 サイクルで実体化した evidence と deferred evidence を分離
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`

## Implemented (real code modifications, this cycle, working-tree)

再検証で origin/dev 上の実コードと spec FR-1 / FR-2 / NFR-1 の乖離が判明したため、本サイクルで以下を実装した:

- `apps/web/src/lib/env.ts` — `EnvSchema` に `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` を追加
- `apps/web/wrangler.toml` — `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 各セクションに `NEXT_PUBLIC_SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` を追加
- `apps/web/.dev.vars.example` — spec 正本の op://UBM-Hyogo path に統一、`NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` 追加
- `apps/web/src/lib/__tests__/env.test.ts` — `NEXT_PUBLIC_SENTRY_DSN` parse PASS / 不正 URL reject / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` enum reject / public sample-rate parse and range reject のテストケース追加

検証結果: typecheck PASS / lint PASS / vitest **445/445 PASS** / next build PASS / OpenNext Cloudflare build PASS / G4 grep gate PASS。

## Not changed in this cycle

- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` — runtime evidence セクション追記は G5 で実施するため本サイクルでは未更新
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` — 同上

## Not Promoted

- Parent task-03 (`docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md`) のメタ「状態」は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持。
- G1（Cloudflare secret put）/ G2（staging deploy）/ G3（curl + Sentry dashboard 観測）/ G5（state 昇格 + commit/PR）は本サイクル未実行。
- 1Password `UBM-Hyogo` vault と `Sentry Web DSN (staging|production)` item の provisioning が前提として未成立（G1 halt 理由）。
