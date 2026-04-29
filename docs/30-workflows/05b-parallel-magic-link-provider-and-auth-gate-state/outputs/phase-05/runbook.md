# Phase 5 — 実装 Runbook

実装手順を再現可能な順序で示す。すべて `mise exec -- pnpm` 経由で実行する。

## 前提

- Node 24 + pnpm 10 が `mise install` 済み
- `mise exec -- pnpm install` 完了
- `apps/api/src/repository/magicTokens.ts` の issue/verify/consume が既存
- `packages/shared/src/types/viewmodel/index.ts` に SessionUser / AuthGateState (branded) 既存

## ステップ

### S1. shared types 整備
1. `packages/shared/src/types/auth.ts` を作成し `SessionUserAuthGateState` を export。
2. `packages/shared/src/index.ts` に `export * from "./types/auth";` を追加。
3. `mise exec -- pnpm typecheck` で衝突なきこと確認。

### S2. magicTokens repository 拡張
1. `apps/api/src/repository/magicTokens.ts` に `deleteByToken(c, token)` を追加 (DELETE WHERE token=?1)。
2. F-11 (mail 失敗 rollback) のために必要。

### S3. use-case 層 (4 本)
1. `resolve-gate-state.ts` — `findIdentityByEmail` → `getStatus` の合成。優先度 unregistered → deleted → rules_declined → ok。
2. `resolve-session.ts` — resolve-gate-state + `isActiveAdmin` → SessionUser。
3. `issue-magic-link.ts` — gate ok のみ token 発行。mail 失敗で deleteByToken。
4. `verify-magic-link.ts` — `consume` → email 一致確認 → resolve-session 合成。

### S4. service 層
1. `services/mail/magic-link-mailer.ts` を作成。
2. `MailSender` interface、`buildMagicLinkMessage` (text+html)、`createResendSender({apiKey})` を実装。
3. Resend HTTP API (`https://api.resend.com/emails`) のみ。SDK 不採用 (#10 free-tier)。

### S5. middleware
1. `middleware/rate-limit-magic-link.ts` を作成。
2. in-memory Map bucket、SHA-256 で email を hash、IP は `cf-connecting-ip` 由来。
3. `POST_MAGIC_LINK_EMAIL_LIMIT=5` / `GET_GATE_STATE_IP_LIMIT=60` / window=1h。
4. test 用に `__resetRateLimitMagicLinkForTests()` を export。

### S6. route 層
1. `routes/auth/schemas.ts` で zod strict schema 定義。
2. `routes/auth/index.ts` で `createAuthRoute({resolveMailSender, ttlSec, now, buildMagicLinkUrl})` factory を実装。
3. `apps/api/src/index.ts` で `/auth` に mount。Env に AUTH_SECRET/AUTH_URL/MAIL_PROVIDER_KEY/MAIL_FROM_ADDRESS を追加。
4. MAIL_PROVIDER_KEY 未設定時は no-op sender (production 環境では 502 `MAIL_FAILED` を返す動作)。

### S7. apps/web proxy (3 本)
1. `app/api/auth/magic-link/route.ts` (POST) — body と cf-connecting-ip を upstream に forward。
2. `app/api/auth/gate-state/route.ts` (GET) — query email を encode して forward。
3. `app/api/auth/magic-link/verify/route.ts` (POST) — body forward。
4. すべて INTERNAL_API_BASE_URL env (fallback `http://127.0.0.1:8787`) を使う。
5. `app/lib/auth/config.ts` を Auth.js 採用時の session callback 正本ドキュメントとして配置。

### S8. tests
1. `__tests__/_seed.ts` で fixture helper (seedValidMember/seedRulesDeclinedMember/seedDeletedMember/seedAdminUser)。
2. use-case test 4 本 + route contract test + rate-limit test を追加。
3. `mise exec -- pnpm test` で all green を確認。

### S9. AC-7 fs-check
1. `apps/api/scripts/no-access-fs-check.sh` を作成。
2. `/no-access` route 不在 + `/no-access` 文字列参照不在 + apps/web から D1 binding 直参照不在の 3 条件を grep で検証。
3. `bash apps/api/scripts/no-access-fs-check.sh` で `OK` を確認。

## ロールバック手順

- S6 まで完了後にバグ発覚した場合: `apps/api/src/index.ts` から `/auth` mount を一時的に削除すれば外部影響なし (use-case ファイル単独では public surface に影響しない)。
- mail 設定 (MAIL_PROVIDER_KEY) を空にすれば本番でも no-op sender が 502 `MAIL_FAILED` を返すだけで token は発行されない (S6 step 4)。
