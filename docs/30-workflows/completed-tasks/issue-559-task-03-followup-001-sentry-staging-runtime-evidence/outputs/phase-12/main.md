# Phase 12 main

## Verdict

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持する。

## This cycle (2026-05-08 / wt-13)

本サイクルでは worktree 起点を `origin/main` から `origin/dev`（HEAD `7d27f796`）へ rebase し、親 task-03 の runtime 実装ファイル（`instrumentation.ts` / `instrumentation-client.ts` / `lib/sentry/capture.ts`）を取り込んだ上で、spec FR-1 / FR-2 / NFR-1 の未実装差分を**実コードに実装**し、evidence を取得した:

- 実コード変更（FR-1 / FR-2 / NFR-1）:
  - `apps/web/src/lib/env.ts` — `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` を `EnvSchema` に追加
  - `apps/web/wrangler.toml` — `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に `NEXT_PUBLIC_SENTRY_ENVIRONMENT` を追加
  - `apps/web/.dev.vars.example` — `op://UBM-Hyogo/...` に統一、`NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` 追加
  - `apps/web/src/lib/__tests__/env.test.ts` — `NEXT_PUBLIC_SENTRY_*` 3 テストケース追加
- G0 preflight PASS（`outputs/phase-11/evidence/preflight-g0.log`）
- ローカル品質ゲート 5 点 PASS（typecheck / lint / **445 tests** / next build / OpenNext Cloudflare build）
- G4 grep gate（pre-deploy 段階, scope=`apps/web/.open-next/worker.js`, post-implementation rebuild）PASS（`outputs/phase-11/evidence/grep-gate-runtime.log`）
  - `requestIdleCallback`: 0 件
  - `@sentry/nextjs`: 0 件
- DSN leak scan PASS（`outputs/phase-11/evidence/dsn-leak-scan.log`、検出はプレースホルダ例のみ）

G1 secret 投入は **prerequisite 未成立**（1Password に `UBM-Hyogo` vault 及び `Sentry Web DSN (staging|production)` item が未 provisioning）のため halt。G2/G3 は G1 halt に伴い未実行。`task-03-w2-par-sentry-workers-sdk-unify.md` のメタ「状態」は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持。

詳細は `outputs/phase-11/main.md` 参照。

## Completed

- Task 12-1 implementation guide: `implementation-guide.md`
- Task 12-2 system spec update summary: `system-spec-update-summary.md`
- Task 12-3 documentation changelog: `documentation-changelog.md`
- Task 12-4 unassigned task detection: `unassigned-task-detection.md`
- Task 12-5 skill feedback report: `skill-feedback-report.md`
- Task 12-6 compliance check: `phase12-task-spec-compliance-check.md`

## State Boundary

Root `artifacts.json` is the only artifacts ledger for this spec-created workflow. `outputs/artifacts.json` is intentionally absent.

## Deferred to next cycle

- 1Password `UBM-Hyogo` vault 作成（または既存 vault への path リダイレクトを spec に反映）
- Sentry project provisioning と DSN 発行（server / public 各 1）
- 1Password item `Sentry Web DSN (staging)` / `Sentry Web DSN (production)` 作成（fields: `dsn`, `public_dsn`）
- G1（Cloudflare Secrets staging への `SENTRY_DSN_WEB` / `NEXT_PUBLIC_SENTRY_DSN` 投入）
- G2（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`）
- G3（curl 200 × 2 + Sentry dashboard server/browser event 観測 + screenshot 取得）
- G4（deploy 後 grep gate 再走承認）
- G5（`task-03-w2-par-sentry-workers-sdk-unify.md` 状態昇格 → `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED`）
