# Phase 5 — 実装ランブックサマリ + 実コード

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 状態 | completed |
| 上流 | phase-04（テスト戦略） |
| 下流 | phase-06（異常系検証） |

## 実装ファイル一覧

### packages/shared

| パス | 役割 |
| --- | --- |
| `packages/shared/src/auth.ts` | `AuthSessionUser` / `SessionJwtClaims` / `GateReason` / `signSessionJwt` / `verifySessionJwt` (HS256) |
| `packages/shared/src/auth.test.ts` | sign / verify / 改ざん / 期限切れ / 異 secret / 不正形式 (S-01/02/06/07 + S-EXP/S-SEC/S-FMT) |
| `packages/shared/src/index.ts` | `export * from "./auth"` 追加 |

> 既存 `types/viewmodel/index.ts` の `SessionUser` (`responseId` / `authGateState` 含む) は `me/*` API 用に温存。Auth.js v5 session callback 専用の型は `AuthSessionUser` に分離した。

### apps/api

| パス | 役割 |
| --- | --- |
| `apps/api/src/middleware/admin-gate.ts` | `requireSyncAdmin` を export（cron / 自動化用、Bearer SYNC_ADMIN_TOKEN）。既存 `adminGate` は deprecated alias として残し、`/admin/*` 既存 13 endpoint の test を破壊しない |
| `apps/api/src/middleware/internal-auth.ts` | 新規。`X-Internal-Auth: <INTERNAL_AUTH_SECRET>` を強制する Worker-to-Worker 認証 |
| `apps/api/src/middleware/require-admin.ts` | 新規。`requireAuth` (JWT verify only) と `requireAdmin` (JWT verify + isAdmin)。Authorization Bearer / Cookie 両対応 |
| `apps/api/src/middleware/require-admin.test.ts` | G-04〜G-08 + G-CFG + G-CK1/2 + G-AUT (8 ケース) |
| `apps/api/src/routes/auth/session-resolve.ts` | 新規。`GET /auth/session-resolve?email=...`、`internalAuth` middleware で保護、4 状態判定 |
| `apps/api/src/routes/auth/session-resolve.test.ts` | R-01〜R-06 + R-AUTH + R-NORM (8 ケース) |
| `apps/api/src/index.ts` | `app.route("/auth", createSessionResolveRoute())` 配線、`AUTH_SECRET` / `INTERNAL_AUTH_SECRET` を Env に追加 |

### apps/web

| パス | 役割 |
| --- | --- |
| `apps/web/src/lib/auth.ts` | Auth.js v5 + GoogleProvider 設定。session strategy=jwt(24h), `signIn` / `jwt` / `session` callback。`fetchSessionResolve` で API worker `/auth/session-resolve` を呼ぶ |
| `apps/web/src/lib/session.ts` | `SessionUser` 型 + `getSession()` (Server Component / Route Handler 用) |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | Auth.js v5 standard route handler (`GET` / `POST` を再 export) |
| `apps/web/middleware.ts` | edge runtime gate。`/admin/:path*` matcher、未ログイン / `isAdmin!==true` は `/login?gate=admin_required` |
| `apps/web/package.json` | `next-auth@5.0.0-beta.25` 追加 |

## 既存挙動への影響

- **人間向け admin endpoint** (`/admin/dashboard` ほか 9 router) は `requireAdmin` に差し替え、Auth.js 共有 HS256 JWT の `isAdmin=true` を必須にする。テストは 34/34 pass。
- **sync 系 admin endpoint** (`/admin/sync*`) は `requireSyncAdmin` のまま Bearer `SYNC_ADMIN_TOKEN` を維持する。

## sanity check (S-01〜S-11)

実機検証は 06 (UI) 完成後に実施。runbook と placeholder は phase-05 の上位仕様 `phase-05.md` に記載済。

## secrets 配線（実値はリポジトリに含めない）

| 名前 | 配置 |
| --- | --- |
| AUTH_SECRET | `bash scripts/cf.sh secret put AUTH_SECRET --config apps/web/wrangler.toml --env <env>`（apps/api 側にも同値で put） |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (= AUTH_GOOGLE_ID/SECRET) | apps/web のみ |
| INTERNAL_AUTH_SECRET | apps/web / apps/api 両方に同値 |
| AUTH_URL / INTERNAL_API_BASE_URL | wrangler.toml の `[env.<env>.vars]` |

## 検証結果

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm typecheck` | pass (shared / api / web 全て) |
| `mise exec -- pnpm lint` | pass (lint-boundaries.mjs + tsc 全 workspace) |
| `mise exec -- pnpm test` | 59 / 59 targeted pass (shared JWT, session-resolve, require-admin, admin route gate) |

## 次 Phase 引き継ぎ

- phase-06: 異常系（OAuth state mismatch / CSRF / replay） 整理
- phase-07: AC × test ID マトリクス確定
- phase-08: DRY 化（重複ロジック洗い出し）
- phase-09: typecheck/lint/test 最終確認
- phase-10: 最終レビュー & 残課題整理
