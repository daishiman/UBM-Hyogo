# Phase 8 outputs — DRY 化サマリ

## 概要

ut-11 の OAuth + PKCE / session / admin gate 周りで、命名・型・endpoint・file path・cookie・helper 命名・navigation のゆれを Before / After 表で整理した結果。すべての DRY 化候補は `apps/web/src/lib/{oauth,auth}/` に集約され、不変条件 #5（apps/web → D1 禁止）・不変条件 #6（GAS prototype 不昇格）を満たす範囲に閉じる。

## DRY 化候補（auth utility）

| ファイル | export | 利用元 |
| --- | --- | --- |
| `apps/web/src/lib/oauth/pkce.ts` | `generateCodeVerifier()`, `deriveCodeChallenge(verifier)` | login route |
| `apps/web/src/lib/oauth/state.ts` | `generateState()`, `verifyState(received, stored)` | login + callback route |
| `apps/web/src/lib/auth/session.ts` | `signSessionJwt(payload, secret)`, `verifySessionJwt(token, secret)` | callback route + middleware |
| `apps/web/src/lib/auth/allowlist.ts` | `parseAllowlist(value)`, `isAdminEmail(email, allowlist)` | callback route |
| `apps/web/src/lib/auth/cookies.ts` | `SESSION_COOKIE_OPTIONS`, `OAUTH_TEMP_COOKIE_OPTIONS`, `COOKIE_NAMES` | login + callback + logout route + middleware |

## 主要 Before / After（要旨）

| 種別 | Before（候補ゆれ） | After（確定） |
| --- | --- | --- |
| session 型 | `AdminSession` / `JwtPayload` | `SessionJwt` |
| login route path | `/login/google` 等 | `/api/auth/login` |
| callback route path | `/oauth/callback` 等 | `/api/auth/callback/google` |
| logout route path | `/logout` 等 | `/api/auth/logout` |
| session 鍵 env | `JWT_SECRET` / `AUTH_SECRET` | `SESSION_SECRET` |
| allowlist env | `ADMIN_EMAILS` / `ALLOWLIST` | `ADMIN_EMAIL_ALLOWLIST` |
| redirect URI env | `OAUTH_CALLBACK_URL` 等 | `AUTH_REDIRECT_URI` |
| session cookie 名 | `auth_session` 等 | `session` |
| temp cookie 名 | `state` / `pkce` | `oauth_state` / `oauth_verifier` |
| middleware 配置 | `apps/web/src/middleware.ts` | `apps/web/middleware.ts`（root） |
| PKCE helper | `createVerifier` / `makePkce` | `generateCodeVerifier` / `deriveCodeChallenge` |
| session helper | `createSession` / `parseSession` | `signSessionJwt` / `verifySessionJwt` |
| allowlist helper | `checkAdmin` 等 | `isAdminEmail` |
| gate 理由 | `denyReason` / `gateError` | `gateReason`（"unauthenticated" / "admin_required" / "allowlist_denied"） |

## navigation drift チェック結果

| 経路 | After 文字列 |
| --- | --- |
| 未認証 → admin | `/login`（middleware redirect） |
| isAdmin=false | `/login?gate=admin_required` |
| allowlist deny | `/login?gate=allowlist_denied` または 403 |
| logout 後 | `/login` |
| login 成功後 | `/admin`（または `?next=` 値） |

`gateReason` 値は `apps/web/src/lib/auth/cookies.ts`（または定数モジュール）で一元管理し、UI 文言・middleware・route 間でゆれを発生させない。

## 不変条件への対応

- #5: DRY 化候補が `apps/web/src/lib/*` のみで完結し、D1 binding / `apps/api` 直接 import を含まない
- #6: helper はすべて Web Crypto API ベースで実装し、GAS prototype の実装を継承しない（`node:crypto` 不使用）

## 次 Phase 引継ぎ

- typecheck / lint / build の対象は `apps/web/src/{app/api/auth,lib/oauth,lib/auth,middleware.ts}` および `apps/web/middleware.ts`
- gitleaks の対象 secret 名: `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- lint 追加ルール候補: `apps/web/` 配下で `node:crypto` import を error にする
