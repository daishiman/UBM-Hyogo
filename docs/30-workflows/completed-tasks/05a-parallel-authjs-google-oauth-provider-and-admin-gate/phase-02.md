# Phase 2 — 設計: provider 構成、session callback、admin gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 2 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-01（要件定義） |
| 下流 | phase-03（設計レビュー）|

## 目的

Phase 1 で確定した要件を、`apps/web` / `apps/api` 上で実現する **provider / callback / middleware** の具体構造に落とし込む。session JWT の構造、Cloudflare Edge runtime 上での Auth.js 配線、admin gate の二段防御（middleware + API gate）を設計し、Phase 5 ランブックの runnable spec を準備する。

## 構造（Mermaid）

```mermaid
flowchart LR
  Browser[ブラウザ] -->|signIn google| WebPages[apps/web Pages]
  WebPages --> Authjs[Auth.js v5 GoogleProvider]
  Authjs -->|OAuth redirect| Google[Google OAuth 2.0]
  Google -->|callback| Authjs
  Authjs -->|JWT signing AUTH_SECRET| SessionJWT[(JWT memberId isAdmin email)]
  Authjs -->|callback signIn| ApiAuth[apps/api session lookup]
  ApiAuth --> RepoIdentity[(member_identities)]
  ApiAuth --> RepoAdmin[(admin_users)]
  RepoIdentity --> ApiAuth
  RepoAdmin --> ApiAuth
  ApiAuth -->|memberId isAdmin| Authjs
  Authjs --> SessionJWT

  Browser -->|/admin/*| EdgeMW[middleware.ts edge]
  EdgeMW -->|verify JWT + isAdmin| SessionJWT
  EdgeMW -->|gate ok| AdminPages[apps/web admin pages]
  EdgeMW -->|gate ng| Login[redirect /login]

  Browser -->|/admin/* API| ApiAdmin[apps/api requireAdmin]
  ApiAdmin -->|verify JWT + isAdmin| SessionJWT
  ApiAdmin -->|gate ok| AdminEndpoints[/admin/* endpoints]
  ApiAdmin -->|gate ng| Forbidden[401/403]
```

## モジュール設計

| ファイル | 役割 |
| --- | --- |
| `apps/web/src/lib/auth.ts` | Auth.js v5 instance, GoogleProvider 設定, callbacks |
| `apps/web/src/app/api/auth/[...nextauth]/route.ts` | Auth.js handlers export（GET/POST） |
| `apps/web/middleware.ts` | `/admin/*` 用 admin gate（JWT verify + `isAdmin === true`） |
| `apps/api/src/middleware/requireAuth.ts` | session JWT verify + `memberId` 解決 |
| `apps/api/src/middleware/requireAdmin.ts` | `requireAuth` に加え `isAdmin === true` を要求 |
| `apps/api/src/routes/auth.ts` | `GET /auth/session-resolve`（callback で web から呼ぶ session lookup endpoint） |
| `packages/shared/src/auth.ts` | `SessionUser` 型, JWT claim 型, `verifyJwt` helper |

## API contract

### `POST /api/auth/signin/google` (Auth.js 標準)
- Auth.js が提供。リクエスト `{ csrfToken, callbackUrl }` → Google OAuth へ redirect

### `GET /api/auth/callback/google` (Auth.js 標準)
- Google から callback、`profile.email` を抽出 → `signIn` callback へ

### `signIn` callback
- 入力: `{ user: { email }, account: { provider: "google" }, profile }`
- 処理:
  1. `apps/api` の `GET /auth/session-resolve?email=<email>` を fetch（apps/web から呼ぶ）
  2. response: `{ memberId: string | null, isAdmin: boolean, gateReason?: "unregistered"|"rules_declined"|"deleted" }`
  3. `memberId === null` の場合 `false` を返し、Auth.js が `/login?gate=<gateReason>` に redirect

### `jwt` callback
- 入力: `{ token, user, account }`
- 処理: `token.memberId = user.memberId`, `token.isAdmin = user.isAdmin`, `token.email = user.email`

### `session` callback
- 入力: `{ session, token }`
- 処理: `session.user = { memberId, isAdmin, email, name }` を返す

### `apps/api` `GET /auth/session-resolve?email=<email>`
- 入力: query `email`
- 処理:
  1. `findIdentityByEmail(email)` (02a) → `{ memberId, isDeleted, rulesConsent }` or null
  2. `null` → `{ memberId: null, isAdmin: false, gateReason: "unregistered" }`
  3. `isDeleted` → `{ memberId: null, isAdmin: false, gateReason: "deleted" }`
  4. `rulesConsent !== "consented"` → `{ memberId: null, isAdmin: false, gateReason: "rules_declined" }`
  5. `isAdmin = isAdminMember(memberId)` (02c)
  6. return `{ memberId, isAdmin, gateReason: null }`

## dependency matrix

| 依存先 | 提供物 | 受け取り場所 |
| --- | --- | --- |
| 02a member repo | `findIdentityByEmail(email)` → `{ memberId, isDeleted }` | `apps/api/routes/auth.ts` |
| 02c admin repo | `isAdminMember(memberId)` → `boolean` | `apps/api/routes/auth.ts` |
| 03b consent | `rulesConsent` snapshot in `member_status` | `findIdentityByEmail` の SELECT に join |
| 04b API | `/me/*` を session で呼ぶ前提 | apps/web の各 server action / fetch |
| 04c API | `/admin/*` を `requireAdmin` で保護 | `apps/api/middleware/requireAdmin.ts` |

## env / secrets

| 名前 | 用途 | 配置先 |
| --- | --- | --- |
| `AUTH_SECRET` | JWT 署名鍵 | Cloudflare Secrets (`wrangler secret put`) |
| `GOOGLE_CLIENT_ID` | OAuth client id | Cloudflare Secrets |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | Cloudflare Secrets |
| `AUTH_URL` | redirect base URL | wrangler vars (`https://<staging|production>.example.com`) |
| `AUTH_GOOGLE_ALLOWED_HD` (optional) | hosted domain 限定 | wrangler vars (任意) |

## session JWT 構造

```ts
type SessionJwt = {
  sub: string;          // = memberId
  memberId: MemberId;   // 不変条件 #7（responseId と分離）
  isAdmin: boolean;
  email: string;
  name?: string;
  iat: number;
  exp: number;          // 24h
};
```

不変条件 #4/#11 のため、`profile`, `responses`, `notes` は **絶対に JWT に載せない**。

## admin gate の二段防御

1. **`apps/web/middleware.ts` (edge)**:
   - matcher: `['/admin/:path*']`
   - JWT verify → `isAdmin === false` → `redirect('/login?gate=admin_required')`
2. **`apps/api/src/middleware/requireAdmin.ts`**:
   - `Authorization: Bearer <jwt>` または cookie 経由で JWT verify
   - `isAdmin === false` → `c.json({ error: 'forbidden' }, 403)`
   - これにより、UI を bypass されても API レベルで gate される

## 05b との contract（session 共有）

両 provider の `signIn` callback は同じ `apps/api` `GET /auth/session-resolve` を呼び、同じ判定ロジックで `memberId` / `isAdmin` を返す。これにより `SessionUser` は provider に依存せず一貫する。

## 4 条件再評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | session 構造と admin gate が UI / API の前提として確定する |
| 実現性 | PASS | Auth.js v5 + Cloudflare Workers の組み合わせは ADR で確認済（infra 04） |
| 整合性 | PASS | 05b と session-resolve endpoint を共有することで二重実装を回避 |
| 運用性 | PASS | JWT 方式で D1 row 増を回避、secrets は infra 04 の体系に乗る |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | JWT 署名は HS256 + AUTH_SECRET（256bit 以上）、token 期限 24h | - |
| privacy | JWT に profile 本文を載せない | #4, #11 |
| 権限境界 | API gate と UI gate の二段防御 | #11 |
| dependency | 02a/02c repository を `apps/api` 経由で呼ぶ（web から D1 直接禁止）| #5 |
| Edge 互換 | middleware と Auth.js callback が Cloudflare Edge runtime で動く | - |
| 観測性 | gate 拒否を audit log に残す（07c と接続）| - |

## サブタスク管理

- [ ] Mermaid 図を outputs/phase-02/architecture.md に転記
- [ ] API contract を outputs/phase-02/api-contract.md に転記
- [ ] admin gate 二段防御図を outputs/phase-02/admin-gate-flow.md に作成
- [ ] 05b の Phase 2 と session-resolve contract を相互レビュー
- [ ] env / secrets 表を outputs/phase-02/secrets.md に転記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | このタスクの scope / AC / 依存関係 |
| 必須 | ../README.md | Wave 全体の実行順と依存関係 |

## 成果物

- `outputs/phase-02/main.md` — Phase 2 サマリ
- `outputs/phase-02/architecture.md` — Mermaid 構造図
- `outputs/phase-02/api-contract.md` — endpoint signature 一覧
- `outputs/phase-02/admin-gate-flow.md` — 二段防御の責務分離
- `outputs/phase-02/secrets.md` — env / secrets table

## 完了条件

- [ ] module 設計表 / API contract / Mermaid 図 / 二段防御 / session JWT 構造が記載
- [ ] env / secrets 表が確定
- [ ] 05b との contract が明示

## タスク 100% 実行確認

- [ ] Mermaid 図に Browser → Authjs → session JWT のフローが含まれる
- [ ] admin gate の二段（middleware + requireAdmin）が両方記載
- [ ] JWT に profile / responses / notes が **載っていない** ことを spec で明示
- [ ] `apps/web` から D1 直接呼び出しが **無い** ことを設計で確認
- [ ] 05b との session-resolve contract が ADR 形式で記載

## 次 Phase

Phase 3（設計レビュー）で次を判定:
- alternative: session storage に DB を採用すべきか / JWT のみで良いか
- alternative: middleware vs HOC（ページ単位 gate）
- PASS / MINOR / MAJOR を確定

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する
