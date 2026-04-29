# Phase 1 — 要件定義サマリ: Google OAuth provider と admin gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 1 / 13 |
| 状態 | completed |
| 上流 | 04b / 04c / 02a / 02c の Phase 13 |
| 下流 | phase-02（設計） |

## 1. true issue（解くべき問題）

UBM 兵庫支部会メンバーサイトの **主導線ログイン**（Google OAuth）を Cloudflare Workers 上の Auth.js v5 で成立させ、`admin_users` テーブルに基づく **admin gate** を `apps/web` middleware と `apps/api` API gate の二段構えで実装する。これにより Wave 6（UI）と Wave 8（test）が依存する `SessionUser` view model（`memberId` / `isAdmin` / `email` / `name`）を確定させる。

### 解いていない問題（scope out）

| # | 内容 | 担当 |
| --- | --- | --- |
| 1 | Magic Link provider 実装 | 05b |
| 2 | `AuthGateState` 5 状態判定 API（`input` / `sent` / `unregistered` / `rules_declined` / `deleted`） | 05b |
| 3 | `/login` `/profile` `/admin/*` 画面実装 | 06a/b/c |
| 4 | `/me/*`・`/admin/*` API の本体ロジック | 04b/04c |
| 5 | `/admin/users` 管理者追加削除 UI | scope out（spec 11） |
| 6 | プロフィール本文の編集機能 | 不変条件 #4/#11 により永久 scope out |

## 2. 価値とコスト

| 項目 | 内容 |
| --- | --- |
| 価値 | 主導線ログインの成立、管理画面の安全性確保、後続 6 タスクの session 前提を確定 |
| 直接コスト | Auth.js v5 + GoogleProvider 設定 spec / middleware spec / secrets 3 個 / `/auth/session-resolve` endpoint spec |
| 間接コスト | session storage 戦略選定（JWT vs DB）、Cloudflare Edge runtime 互換性、05b との session 共有契約 |
| やらない場合のコスト | 主導線ログイン不能（MVP 不成立）、admin gate 不在による情報漏洩（不変条件 #11 違反） |

## 3. 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | MVP 主導線。これがないと Wave 6 以降が成立しない |
| 実現性 | PASS | Auth.js v5 は Cloudflare Workers 互換。`@opennextjs/cloudflare` 上で公式パターンが確立 |
| 整合性 | PASS | 05b と session-resolve endpoint を共有して `MemberId` 解決を一本化、provider 不問で同一 session 構造 |
| 運用性 | PASS | secrets は infra 04 の体系（Cloudflare Secrets / GitHub Secrets / 1Password）に準拠、JWT session で D1 row 増を回避 |

## 4. スコープ確定

### 含む

- Auth.js v5 GoogleProvider の設定 spec（`apps/web/src/lib/auth.ts`）
- secrets 配線: `AUTH_SECRET` / `GOOGLE_CLIENT_ID`（`AUTH_GOOGLE_ID`）/ `GOOGLE_CLIENT_SECRET`（`AUTH_GOOGLE_SECRET`）/ `AUTH_URL`
- `signIn` / `jwt` / `session` callback で `memberId` / `isAdmin` を解決する spec
- `apps/api` 側 `GET /auth/session-resolve?email=...` endpoint contract（apps/web からのみ Worker-to-Worker 認証 header で呼ぶ）
- admin gate 二段防御:
  - `apps/web/middleware.ts`（edge runtime, matcher `/admin/:path*`）
  - `apps/api/src/middleware/requireAdmin.ts`（既存 admin-gate.ts を JWT ベースに置換）
- session JWT claim 構造の確定（`memberId`, `isAdmin`, `email`, `sub`, `iat`, `exp`）
- `packages/shared/src/auth.ts` に `SessionUser` 型と `verifyJwt` helper の API
- 05b との session 共有契約 ADR

### 含まない

- Magic Link provider の動作（**05b**）
- `AuthGateState` 5 状態判定 API（**05b**）
- `/login` `/profile` `/admin/*` 画面（**06**）
- `/admin/users` 管理者追加削除 UI（spec 11 で永久 scope out）
- プロフィール本文編集（不変条件 #4/#11）

## 5. 依存関係（上流の Phase 13 確定確認）

| 依存タスク | 提供物 | signature | 受領場所 |
| --- | --- | --- | --- |
| 02a | `findIdentityByEmail(c, email)` | `(DbCtx, ResponseEmail) => Promise<MemberIdentityRow \| null>` | `apps/api/routes/auth.ts` |
| 02a | `member_status` join（`rules_consent`, `is_deleted`, `publish_state`） | SQL JOIN | `findIdentityByEmail` 内 SQL に追加 |
| 02c | `findByEmail(c, email)` / `isActiveAdmin(c, email)` | `(DbCtx, AdminEmail) => Promise<AdminUserRow \| null>` / `boolean` | `apps/api/routes/auth.ts` |
| 04b | `/me/*` endpoint set | session 確立後に web から fetch | apps/web server actions |
| 04c | `/admin/*` endpoint set | `requireAdmin` で保護対象 | `apps/api/src/middleware/requireAdmin.ts` |

> 既存実装の `apps/api/src/middleware/admin-gate.ts` は MVP スタブ（Bearer SYNC_ADMIN_TOKEN）。本タスクで JWT + `admin_users` 照合方式に置換する。

## 6. 不変条件マッピング

| # | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| #2 | consent キー `publicConsent` / `rulesConsent` 統一 | session-resolve で `rulesConsent !== "consented"` の user は `gateReason: "rules_declined"` を返し session 不発行 |
| #3 | `responseEmail` は system field | OAuth profile の verified email を `member_identities.response_email` で lookup |
| #5 | `apps/web` から D1 直接禁止 | session callback は `apps/api` の `/auth/session-resolve` 経由で D1 lookup。`getCloudflareContext()` 直接 D1 アクセスは禁止 |
| #7 | `responseId` と `memberId` を混同しない | JWT claim には `memberId` のみ含め、`responseId` は載せない |
| #9 | `/no-access` 専用画面に依存しない | 未登録 / 未承認 / 削除済みは `/login?gate=<reason>` に redirect、専用画面を作らない |
| #10 | Cloudflare 無料枠内で運用 | session storage は JWT strategy 採用。`sessions` テーブル不要、D1 row 数 0 増 |
| #11 | 管理者は他人プロフィール本文を直接編集できない | admin gate は閲覧 / 状態操作のみを許可。本文編集 endpoint は 04c で最初から不在を確認 |

## 7. 受入条件 (AC) — index.md より転記

- AC-1: Google OAuth ログインで Auth.js session が確立し、`session.user.memberId` が `member_identities.member_id` と一致する
- AC-2: `member_identities` に email が無い未登録 user は session を作らず、`/login?gate=unregistered` へ redirect
- AC-3: `admin_users` 登録済み user の session は `session.user.isAdmin === true` を含む
- AC-4: `admin_users` 未登録 user が `/admin/*` 画面 access で 403 もしくは `/login` redirect（middleware.ts で gate）
- AC-5: `/admin/*` API endpoint も `requireAdmin` middleware で保護され、未許可は 401/403（contract test 必須）
- AC-6: `AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` がリポジトリに平文で含まれない（gitleaks pass）
- AC-7: secrets は wrangler / GitHub Secrets / 1Password に配置（infra 04 リスト準拠）
- AC-8: session JWT の `memberId` claim 改ざんで verify fail → 401（contract test）
- AC-9: 同一 email で Google OAuth と Magic Link の両方からログインしても、解決される `memberId` が同一（05b と契約共有）
- AC-10: `/admin/*` middleware が apps/web Edge runtime 上で動く（Cloudflare Workers 互換）

## 8. SessionUser view model 確定

```ts
// packages/shared/src/auth.ts
export type MemberId = string & { readonly __brand: "MemberId" };

export interface SessionUser {
  readonly memberId: MemberId;
  readonly email: string;
  readonly name?: string;
  readonly isAdmin: boolean;
}

export interface SessionJwtClaims {
  readonly sub: string;        // = memberId
  readonly memberId: MemberId; // 不変条件 #7
  readonly isAdmin: boolean;
  readonly email: string;
  readonly name?: string;
  readonly iat: number;
  readonly exp: number;        // 24h
}
```

> `SessionUser` には `responseId` / `authGateState` / `profile` 本文を一切含めない（spec 06 の `SessionUser` から `responseId` と `authGateState` を意図的に除外。本タスクは provider 単位の session 確立まで。`authGateState` は 05b の `/me` で別 endpoint として返す）。

## 9. 多角的チェック

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | JWT 改ざん検出（HS256 + AUTH_SECRET 256bit 以上） | - |
| privacy | JWT に profile 本文 / notes / responses を載せない | #4, #11 |
| 権限境界 | admin gate に bypass 条件を作らない | #11 |
| 無料枠 | session storage は JWT 採用、D1 row 増無し | #10 |
| 観測性 | OAuth callback / admin gate 拒否を audit log に残す（07c hook） | - |
| Cloudflare 互換 | middleware と Auth.js callback が edge runtime で動く | - |
| dependency | apps/web から D1 直接禁止 → session-resolve endpoint 経由 | #5 |

## 10. 完了条件チェック

- [x] AC が 10 件（index.md AC-1〜AC-10）
- [x] `SessionUser` 構造が確定
- [x] 不変条件マッピングが 7 個（#2/#3/#5/#7/#9/#10/#11）
- [x] 上流 4 タスク（04b/04c/02a/02c）の signature 整理（dependency-confirmation.md 参照）
- [x] scope out 項目が明確（Magic Link, AuthGateState, /admin/users, 本文編集）

## 11. 次 Phase に渡す引継ぎ

1. `SessionUser` / `SessionJwtClaims` 型定義は `packages/shared/src/auth.ts` に配置
2. session-resolve endpoint は `GET /auth/session-resolve?email=...`、Worker-to-Worker 認証 header で保護
3. JWT TTL は 24h、HS256 + AUTH_SECRET
4. admin gate は `apps/web/middleware.ts` と `apps/api/src/middleware/requireAdmin.ts` の二段防御
5. 既存 `apps/api/src/middleware/admin-gate.ts`（MVP Bearer SYNC_ADMIN_TOKEN）は本タスクで `requireAdmin` に置換予定（後方互換は sync 系のみ別 token に隔離）

## 関連成果物

- `outputs/phase-01/scope-decision.md` — scope in/out の根拠記録
- `outputs/phase-01/dependency-confirmation.md` — 上流 4 タスクの signature 確認
