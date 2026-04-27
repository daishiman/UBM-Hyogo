# Phase 8: DRY 化: 命名 / 型 / path / endpoint / cookie の統一

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 8 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-07（AC マトリクス） |
| 下流 | phase-09（品質保証） |

## 目的

`apps/web` 配下の OAuth + PKCE / session / admin gate 周りで、命名 / 型 / endpoint path / file path / cookie 名 / env 名のゆれや重複を排除する。Phase 2 の設計案 A をベースに、auth utility の共通化候補を Before / After 表で可視化し、Phase 9 の typecheck / lint / build のインプットとする。本タスクは `apps/api` 側に新規実装を持たないため、DRY 化対象は `apps/web/src/lib/auth/*`・`apps/web/src/lib/oauth/*`・`apps/web/middleware.ts`・`apps/web/src/app/api/auth/*` の範囲に閉じる（不変条件 #5）。

## 実行タスク

1. 型 / interface 重複の整理（`SessionJwt` / `AllowlistEntry` / `OAuthTempState`）
2. endpoint path / method 命名統一
3. environment variable 名称統一
4. file path / module 名整理（auth utility の共通化候補）
5. cookie 名 / 属性の集中定義
6. middleware / helper naming 統一
7. navigation drift チェック（`/login` / `/admin` / `?gate=...` のリンク文言）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/architecture.md | module 構成 |
| 必須 | outputs/phase-02/api-contract.md | endpoint I/O |
| 必須 | outputs/phase-02/secrets.md | env / secrets |
| 必須 | outputs/phase-07/ac-matrix.md | AC との対応 |
| 参考 | docs/30-workflows/unassigned-task/UT-11-google-oauth-admin-login-flow.md | 元仕様用語 |
| 参考 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | secret 名前空間共有 |
| 参考 | CLAUDE.md | 不変条件 #5 / #6 |

## 実行手順

### ステップ 1: Before / After（型）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| session 型 | `AdminSession` / `JwtPayload` 等のゆれ候補 | `SessionJwt` (`{ sub, email, isAdmin: true, iat, exp }`) | Phase 2 設計と一致 |
| allowlist 要素 | `string` 直書き / `AdminEmail` | `AllowlistEntry`（lowercase 正規化済 string の branded type） | 比較ロジックの一元化 |
| OAuth 一時状態 | `{ state, verifier }` を route handler 内で literal | `OAuthTempState`（`{ state: string; codeVerifier: string }`） | テスト容易性 |
| Cookie 属性 | route handler 内で literal | `SessionCookieOptions` / `OAuthTempCookieOptions` | 属性の単一情報源 |
| OAuth エラー理由 | `denyReason` / `gateError` のゆれ | `gateReason`（`"unauthenticated" | "admin_required" | "allowlist_denied"`） | navigation drift 防止 |

### ステップ 2: Before / After（endpoint）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| login 開始 | `/login/google` / `/auth/start` 等の候補 | `GET /api/auth/login` | 元仕様 AC-1 |
| OAuth callback | `/oauth/callback` / `/api/oauth/google` | `GET /api/auth/callback/google` | 元仕様準拠、UT-11 元仕様 |
| logout | `/logout` / `/api/logout` | `POST /api/auth/logout`（GET も許容） | AC-8 |
| admin gate | `getServerSession()` HOC / 各 page で `requireAdmin()` | `apps/web/middleware.ts`（matcher `/admin/:path*`） | AC-7、E 案不採用の徹底 |

### ステップ 3: Before / After（env）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| OAuth client | `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_ID` 等のゆれ | `GOOGLE_CLIENT_ID`（既配置） | 01c で配置済の名前を踏襲 |
| OAuth secret | 同上ゆれ | `GOOGLE_CLIENT_SECRET`（既配置） | 同上 |
| session 鍵 | `JWT_SECRET` / `AUTH_SECRET` | `SESSION_SECRET` | UT-11 元仕様で確定 |
| 管理者リスト | `ADMIN_EMAILS` / `ALLOWLIST` | `ADMIN_EMAIL_ALLOWLIST` | UT-11 元仕様で確定 |
| redirect URI | `OAUTH_CALLBACK_URL` / `GOOGLE_REDIRECT_URI` | `AUTH_REDIRECT_URI` | 環境別 vars で統一 |

### ステップ 4: Before / After（file path / module）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| login route | `apps/web/src/app/login/route.ts` | `apps/web/src/app/api/auth/login/route.ts` | 元仕様 AC-1 path |
| callback route | `apps/web/src/app/oauth/callback/route.ts` | `apps/web/src/app/api/auth/callback/google/route.ts` | 元仕様 AC-3 path |
| logout route | `apps/web/src/app/logout/route.ts` | `apps/web/src/app/api/auth/logout/route.ts` | 同上 |
| PKCE helper | `apps/web/src/utils/pkce.ts` / 各 route 内 inline | `apps/web/src/lib/oauth/pkce.ts` | DRY: `generateCodeVerifier` / `deriveCodeChallenge` 共通化 |
| state helper | route 内 inline | `apps/web/src/lib/oauth/state.ts` | `generateState` / `verifyState` 共通化 |
| session 署名 / 検証 | route と middleware で重複実装候補 | `apps/web/src/lib/auth/session.ts` | `signSessionJwt` / `verifySessionJwt` を 1 か所に |
| allowlist parse | callback 内 inline | `apps/web/src/lib/auth/allowlist.ts` | `parseAllowlist` / `isAdminEmail` 共通化 |
| Cookie 属性 | 各 route で literal | `apps/web/src/lib/auth/cookies.ts` | session / oauth temp の属性集中定義 |
| middleware | `apps/web/src/middleware.ts` 候補 | `apps/web/middleware.ts`（root） | Next.js 規約 |

### ステップ 5: Before / After（cookie）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| session cookie 名 | `auth_session` / `token` 等のゆれ | `session` | Phase 2 spec |
| temp state cookie 名 | `state` / `oauth_state_tmp` | `oauth_state` | Phase 2 spec |
| temp verifier cookie 名 | `verifier` / `pkce` | `oauth_verifier` | Phase 2 spec |
| Path 属性 | `/` / `/auth` のゆれ | session: `/`、oauth_*: `/api/auth/callback/google` | Phase 2 spec、CSRF 影響範囲最小化 |
| Max-Age | route 毎にハードコード | `cookies.ts` の定数（session: 86400、oauth_*: 600） | DRY |

### ステップ 6: helper / middleware naming 統一

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| PKCE 生成 | `createVerifier` / `makePkce` | `generateCodeVerifier` / `deriveCodeChallenge` | RFC 7636 用語に一致 |
| state 検証 | `checkState` / `validateState` | `verifyState(received, stored)` | verify- 命名統一 |
| session 発行 | `createSession` / `makeJwt` | `signSessionJwt` | 動詞 + 対象 |
| session 検証 | `parseSession` / `decodeJwt` | `verifySessionJwt` | 同上 |
| allowlist 判定 | `checkAdmin` / `inAllowlist` | `isAdminEmail(email, allowlist)` | 述語命名 |
| middleware export | `middleware` / `default function` | `export default function middleware()` + `export const config = { matcher: ['/admin/:path*'] }` | Next.js 規約 |

### ステップ 7: navigation drift チェック

| 経路 | 期待文字列 | 確認対象 |
| --- | --- | --- |
| 未認証 → admin | `/login` redirect | middleware / login link |
| isAdmin=false | `/login?gate=admin_required` | middleware |
| allowlist deny | 403 ページ or `/login?gate=allowlist_denied` | callback route |
| logout 後 | `/login` | logout route |
| login 成功後 | `/admin`（または `?next=` 値） | callback route |

> `gateReason` の値（`"unauthenticated" | "admin_required" | "allowlist_denied"`）を `cookies.ts` または定数モジュールで一元管理し、UI 文言や middleware と route 間でゆれないようにする。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 命名統一後の typecheck / lint / build pass |
| Phase 11 | smoke 時の URL / cookie 名 / env 名が本表と一致 |
| Phase 12 | implementation-guide が本表の用語を踏襲 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #5 (apps/web → D1 禁止) | DRY 化候補が `apps/web/src/lib/*` のみで完結し、D1 アクセス層が混入しない | #5 |
| #6 (GAS prototype 不昇格) | helper 名が GAS 由来命名を継承していない | #6 |
| 認可境界 | session 検証ロジックが middleware と route の両方で同じ helper を使う | - |
| privacy | session 型に `picture` / `name` 等を追加しない（After 列で明示） | - |
| navigation drift | `gateReason` 値の集中管理 | - |
| Edge 互換 | helper が `node:crypto` を import しない（Web Crypto API のみ） | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 型 Before / After | 8 | pending | 5 件 |
| 2 | endpoint Before / After | 8 | pending | 4 件 |
| 3 | env Before / After | 8 | pending | 5 件 |
| 4 | file path Before / After | 8 | pending | 9 件 |
| 5 | cookie Before / After | 8 | pending | 5 件 |
| 6 | helper / middleware naming | 8 | pending | 6 件 |
| 7 | navigation drift チェック | 8 | pending | 5 経路 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before / After 表（型・endpoint・env・file path・cookie・naming・navigation） |
| メタ | artifacts.json | phase 8 status |

## 完了条件

- [ ] 型・endpoint・env・file path・cookie・naming・navigation の 7 種で Before / After 表が完成
- [ ] spec 用語（PKCE / state / `SessionJwt` / `gateReason` 等）との一致を全行で確認
- [ ] auth utility（pkce / state / session / cookies / allowlist）の共通化候補が `apps/web/src/lib/*` に集約
- [ ] 不変条件 #5 / #6 への配慮が明記
- [ ] navigation drift（`/login` / `/admin` / `?gate=...`）にゆれがない

## タスク 100% 実行確認【必須】

- [ ] 全 7 サブタスクが completed
- [ ] outputs/phase-08/main.md 配置
- [ ] 全完了条件にチェック
- [ ] 次 Phase へ命名規約と file path 配置を引継ぎ

## 次 Phase

- 次: 9（品質保証）
- 引き継ぎ事項: 命名統一案を `pnpm typecheck` / `pnpm lint` / `pnpm build` のインプットに、`AUTH_REDIRECT_URI` / `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を gitleaks ターゲットに
- ブロック条件: spec 用語と不一致な命名が残る場合は進まない
