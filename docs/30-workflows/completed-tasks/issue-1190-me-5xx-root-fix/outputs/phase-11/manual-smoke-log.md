# Phase 11 Manual Smoke Log（NON_VISUAL / implemented_local_evidence_captured）

タスク種別 NON_VISUAL（UI 表現変更なし・代替証跡 = focused vitest + grep/diff gate + staging 実機ログ）。本サイクルで local focused tests は実行済み。staging smoke は user-gated pending。

## Local（本サイクルで取得）

- focused vitest（TC-1〜TC-4: `apps/api/src/routes/me/index.contract.spec.ts` + ``）: present（本サイクルで取得）。
- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` / `mise exec -- pnpm --filter @ubm-hyogo/api lint`: present（本サイクルで取得）。
- `git diff --stat -- apps/web`（空・apps/web 非接触・AC-6）: present（本サイクルで取得）。
- `grep -n "context: {" apps/api/src/middleware/session-guard.ts apps/api/src/routes/me/index.ts`（literal scope のみ・AC-5）: present（本サイクルで取得）。

## Staging（user-gated）

- `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`（MT-5）: pending（user-gated）。
- `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` + staging `/profile` 発火で `/me`・`/me/profile` を確認し、5xx 再発時に `UBM-5001` + `context.scope` がログに出ること（MT-6）: pending（user-gated）。
- ログに memberId / email が含まれないこと（#11）の目視確認: pending（user-gated）。

スクリーンショットは NON_VISUAL ゆえ取得しない。
