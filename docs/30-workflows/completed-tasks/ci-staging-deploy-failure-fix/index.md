# ci-staging-deploy-failure-fix

[実装区分: 実装仕様書 / 種別: NON_VISUAL / 監査・修復タスク]
[workflow_state: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING]
[implementation_status: task-01_implemented_local_task-02_external_ops_pending]
[Phase 13: pending_user_approval（commit / push / PR / Cloudflare token rotation / GitHub Secret mutation）]

## 1. 背景

PR #815 マージ後の `dev` push で 2 workflow が staging deploy 段階で fail。

| workflow | job | step | 失敗種別 |
|----------|-----|------|---------|
| `web-cd` | `deploy-staging` | `Build web app (OpenNext Workers bundle)` | Zod env validation throw（prerender `/_not-found`） |
| `backend-ci` | `deploy-staging` | `Apply D1 migrations` | Cloudflare API Authentication error（code 10000 / 9109） |

## 2. 根本原因

### web-cd
`next build`（OpenNext Cloudflare bundle 生成）は Node プロセス上で実行され、`apps/web/wrangler.toml [vars]` は Workers ランタイム binding なので **build 時には注入されない**。`apps/web/src/lib/env.ts` の `EnvSchema.parse` は `ENVIRONMENT` / `NEXT_PUBLIC_API_BASE_URL` を required 扱いで throw。

呼び出し経路:
- `app/_not-found` プリレンダリング → metadata 生成 → `apps/web/src/lib/seo/site-metadata.ts:21` で `getPublicEnv()` → throw。
- `app/sitemap.ts` / `app/robots.ts` も同様の build-time 呼び出しを持つ。

### backend-ci
`CLOUDFLARE_API_TOKEN` の **値が無効**（Invalid access token / code 9109）。
直近の修復 #847 は Secret **名称** の統一（`CF_TOKEN_D1_STAGING` → `CLOUDFLARE_API_TOKEN`）であり、**値そのものの permission / 有効性** は別問題。

候補:
- Token に `Account → D1:Edit` scope が付与されていない
- Token が rotation / 失効されている
- Account ID と Token の組み合わせ不整合

## 3. スコープ（CONST_007: 単一実装サイクル完了）

| task | 目的 | 並列性 |
|------|------|--------|
| task-01-web-build-env-injection | `next build` step に build-time placeholder env を注入し、`/_not-found` prerender を成功させる | 並列可 |
| task-02-cf-api-token-d1-permission-restore | Cloudflare API Token を D1:Edit + Workers Scripts:Edit scope で再発行し、staging/production GitHub Environment に再登録 | 並列可 |

両 task は独立リソース（task-01: workflow YAML + `apps/web/src/lib/seo/`、task-02: Cloudflare dashboard + GitHub Secrets）のため並列実行可能。

## 4. スコープ外（先送り禁止：CONST_007 適合）

- Sentry instrumentation の build-time 副作用最小化リファクタ（task-01 内で必要最小限を扱う）
- D1 schema migration の中身（auth 復旧後に既存 migration がそのまま流れることを前提）
- OIDC への移行（issue-762 系列の独立トラック・本サイクル対象外）

## 5. 正本順位

1. `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/phase-{1,2,3}/*.md`
2. 各 task の `outputs/task-NN-*/phase-12/implementation-guide.md`
3. CLAUDE.md（Cloudflare CLI 実行ルール / apps/web env 不変条件）
4. `docs/30-workflows/task-cf-token-staging-injection-fix-001/`（先行類似タスクの参照）

## 6. DoD（workflow 全体）

- `dev` push → `web-cd / deploy-staging` が success
- `dev` push → `backend-ci / deploy-staging` の D1 migration step が success
- 2 task の DoD が個別に満たされている
- Cloudflare staging Worker が deploy 後アクセス可能（`/` の HTTP 200）

## 7. 現wave実装結果（2026-05-20）

| task | 状態 | 根拠 |
|------|------|------|
| task-01-web-build-env-injection | implemented_local | `.github/workflows/web-cd.yml` の staging / production build step に build-time env を追加し、`apps/web/src/lib/__tests__/build-time-env.spec.ts` を追加 |
| task-02-cf-api-token-d1-permission-restore | external_ops_pending | Cloudflare token 発行、1Password 更新、GitHub Environment Secret 更新はユーザー承認と実アカウント操作が必要なため未実行。手順は `outputs/task-02-cf-api-token-d1-permission-restore/runbook.md` に固定 |
| Phase 11 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING | local test / grep / build smoke は取得。dev push 後の GHA runtime success、D1 migration、staging HTTP 200 は user-gated |
| Phase 12 | strict_7_present | `outputs/phase-12/` の 7 ファイル、root/output `artifacts.json` parity、aiworkflow-requirements same-wave sync を追加 |
