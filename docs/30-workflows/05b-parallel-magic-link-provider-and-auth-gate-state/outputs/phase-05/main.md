# Phase 5 — 実装ランブック (main)

## サマリ

Phase 4 の test matrix に従って apps/api 側 use-case 4 本 / route 1 本 / middleware 1 本 / mailer 1 本を実装し、apps/web 側は同 origin proxy 3 本 + Auth.js 設定 placeholder を配置した。AC-7 fs-check スクリプトで `/no-access` 不在と D1 直接参照不在を機械検証する。

## 生成・変更ファイル一覧

### apps/api (実装)

| ファイル | 役割 |
|---|---|
| `apps/api/src/use-cases/auth/resolve-gate-state.ts` | email -> {state, memberId, responseId}。判定優先度: unregistered → deleted → rules_declined → ok。 |
| `apps/api/src/use-cases/auth/issue-magic-link.ts` | gate-state が ok の時のみ token 発行。mail 失敗で deleteByToken による rollback (F-11)。 |
| `apps/api/src/use-cases/auth/verify-magic-link.ts` | token consume → email 一致確認 → resolve-session の合成。reason: not_found / expired / already_used / resolve_failed。 |
| `apps/api/src/use-cases/auth/resolve-session.ts` | resolve-gate-state + admin_users lookup → SessionUser 生成。 |
| `apps/api/src/services/mail/magic-link-mailer.ts` | MailSender interface、buildMagicLinkMessage、createResendSender。 |
| `apps/api/src/middleware/rate-limit-magic-link.ts` | POST /magic-link: email 5/h + IP 30/h。GET /gate-state: IP 60/h。SHA-256 hash bucket。 |
| `apps/api/src/routes/auth/index.ts` | createAuthRoute({resolveMailSender, ttlSec, now, buildMagicLinkUrl})。env-aware factory。 |
| `apps/api/src/routes/auth/schemas.ts` | zod strict schemas (Email/MagicLink/GateState/Verify/ResolveSession)。 |
| `apps/api/src/repository/magicTokens.ts` | `deleteByToken` を追加 (mail 失敗 rollback 用)。 |
| `apps/api/src/index.ts` | `/auth` mount。Env に AUTH_SECRET / AUTH_URL / MAIL_PROVIDER_KEY / MAIL_FROM_ADDRESS を追加。 |
| `apps/api/scripts/no-access-fs-check.sh` | AC-7 fs-check。`/no-access` route 不在 + D1 binding 直参照不在。 |

### apps/web (proxy のみ — 不変条件 #5)

| ファイル | 役割 |
|---|---|
| `apps/web/app/api/auth/magic-link/route.ts` | POST: apps/api `POST /auth/magic-link` へ proxy。cf-connecting-ip 伝搬。 |
| `apps/web/app/api/auth/gate-state/route.ts` | GET: apps/api `GET /auth/gate-state` へ proxy。 |
| `apps/web/app/api/auth/magic-link/verify/route.ts` | POST: apps/api `POST /auth/magic-link/verify` へ proxy。 |
| `apps/web/app/lib/auth/config.ts` | Auth.js 採用時の session callback 正本ドキュメント (placeholder)。 |

### packages/shared

| ファイル | 役割 |
|---|---|
| `packages/shared/src/types/auth.ts` | `SessionUserAuthGateState` alias を export。 |
| `packages/shared/src/index.ts` | auth types を再 export。 |

### tests

| ファイル | カバー AC / test ID |
|---|---|
| `apps/api/src/use-cases/auth/__tests__/_seed.ts` | fixture helper |
| `.../resolve-gate-state.test.ts` | AC-1〜AC-3 |
| `.../issue-magic-link.test.ts` | AC-1, AC-4, F-11 |
| `.../verify-magic-link.test.ts` | T-01〜T-05 (AC-5/AC-6/AC-9) |
| `.../resolve-session.test.ts` | RS-01〜RS-05 (AC-10) |
| `apps/api/src/routes/auth/__tests__/auth-routes.test.ts` | contract: R1-R4, F-01/02/09/11, Z-02 |
| `apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts` | R-01, R-02, R-03 |

## 不変条件遵守

- #2: zod schema は `publicConsent` / `rulesConsent` 名のまま (resolveGateState の `getStatus` 参照経由)。
- #5: apps/web は D1 を読まない。proxy + fetch のみ。fs-check で機械検証。
- #7: SessionUser に memberId と responseId を別 field で保持。zod レスポンスで両方含める。
- #9: `/no-access` route 不在。state はそのまま JSON で返却。fs-check で機械検証。
- #10: 全て Workers + D1 + 自前 fetch のみ。新規 paid サービス不採用。
