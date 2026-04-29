# Phase 2 — 設計サマリ: provider 構成 / session callback / admin gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 2 / 13 |
| 状態 | completed |
| 上流 | phase-01（要件定義） |
| 下流 | phase-03（設計レビュー） |

## 1. 設計の核となる決定事項

| # | 決定 | 根拠 |
| --- | --- | --- |
| D1 | session strategy = **JWT**（database session ではなく） | 不変条件 #10（Cloudflare 無料枠、D1 row 増回避） |
| D2 | session callback は **`apps/api` `GET /auth/session-resolve`** 経由で D1 lookup | 不変条件 #5（apps/web から D1 直接禁止） |
| D3 | admin gate は **二段防御**（`apps/web/middleware.ts` edge + `apps/api/requireAdmin`） | 不変条件 #11（UI 構造の漏洩防止 + API 最終防衛） |
| D4 | `SessionUser` は **`packages/shared/src/auth.ts`** に置き、apps/web/api 双方から import | 二重定義防止、05b との共有 |
| D5 | session-resolve endpoint は **Worker-to-Worker 認証 header**（`X-Internal-Auth: <INTERNAL_AUTH_SECRET>`）で保護 | public 公開すると email 列挙可能 |
| D6 | JWT TTL = **24h**、署名 = **HS256 + AUTH_SECRET**（256bit 以上） | Auth.js v5 デフォルト、refresh は 06b 別タスク |
| D7 | secrets 名は **`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`**（spec 08-free-database 表に準拠） | infra 04 体系との整合 |
| D8 | 既存 `admin-gate.ts`（Bearer SYNC_ADMIN_TOKEN）は **`requireSyncAdmin`** にリネームし sync 系専用に隔離 | 既存 admin endpoint への影響を最小化 |

## 2. モジュール設計

| ファイル | 役割 | 新規/既存 |
| --- | --- | --- |
| `apps/web/src/lib/auth.ts` | Auth.js v5 instance, GoogleProvider 設定, callbacks | 新規 |
| `apps/web/src/lib/session-resolve-client.ts` | `apps/api` `/auth/session-resolve` を fetch する client（Worker-to-Worker auth 付与） | 新規 |
| `apps/web/src/app/api/auth/[...nextauth]/route.ts` | Auth.js handlers export (GET/POST) | 新規 |
| `apps/web/middleware.ts` | `/admin/:path*` admin gate（edge runtime） | 新規 |
| `apps/api/src/routes/auth.ts` | `GET /auth/session-resolve?email=<email>` endpoint | 新規 |
| `apps/api/src/middleware/requireAuth.ts` | session JWT verify + `memberId` 取り出し | 新規 |
| `apps/api/src/middleware/requireAdmin.ts` | `requireAuth` + `isAdmin === true` 要求 | 新規 |
| `apps/api/src/middleware/admin-gate.ts` → `requireSyncAdmin.ts` | 既存 Bearer SYNC_ADMIN_TOKEN を sync 系専用にリネーム | 既存リネーム |
| `apps/api/src/middleware/internal-auth.ts` | session-resolve endpoint 用 Worker-to-Worker 認証 | 新規 |
| `packages/shared/src/auth.ts` | `SessionUser` / `SessionJwtClaims` 型, `verifyJwt` helper | 新規（または apps/api 内にミラー） |

## 3. 構造図（Mermaid）

architecture.md に転記。本ファイルでは概要のみ。

主要フロー:
1. **Sign-in**: Browser → `/api/auth/signin/google` → Google OAuth → callback → `signIn` callback → `apps/api /auth/session-resolve` → JWT 発行
2. **/admin/* ページアクセス**: Browser → `apps/web/middleware.ts` → JWT verify → `isAdmin` 判定 → admin pages or `/login?gate=admin_required`
3. **/admin/* API アクセス**: Browser → `apps/api/requireAdmin` → JWT verify → `isAdmin` 判定 → endpoint or 401/403

## 4. API contract

api-contract.md に詳細。要点:

### `signIn` callback（apps/web）

```ts
async signIn({ user, account, profile }) {
  if (account?.provider !== "google") return false;
  const email = profile?.email;
  const verified = profile?.email_verified;
  if (!email || !verified) return "/login?gate=unregistered";

  const resolved = await fetchSessionResolve(email); // apps/api 経由
  if (!resolved.memberId) {
    return `/login?gate=${resolved.gateReason}`; // unregistered | rules_declined | deleted
  }
  // user object に拡張プロパティを載せて jwt callback で拾う
  (user as any).memberId = resolved.memberId;
  (user as any).isAdmin = resolved.isAdmin;
  return true;
}
```

### `jwt` callback

```ts
async jwt({ token, user }) {
  if (user) {
    token.sub = user.memberId;
    token.memberId = user.memberId;
    token.isAdmin = user.isAdmin;
    token.email = user.email;
    token.name = user.name;
  }
  return token;
}
```

### `session` callback

```ts
async session({ session, token }) {
  session.user = {
    memberId: token.memberId,
    isAdmin: token.isAdmin ?? false,
    email: token.email,
    name: token.name,
  };
  return session;
}
```

### `apps/api` `GET /auth/session-resolve?email=<email>`

入力:
- query: `email` (string, normalized lowercase)
- header: `X-Internal-Auth: <INTERNAL_AUTH_SECRET>` 必須

処理:
1. internal-auth verify → 401 if mismatch
2. `findIdentityByEmail(email)` → MemberIdentityRow + member_status JOIN
3. 判定:
   - null → `{ memberId: null, isAdmin: false, gateReason: "unregistered" }`
   - `is_deleted=true` → `{ memberId: null, isAdmin: false, gateReason: "deleted" }`
   - `rules_consent !== "consented"` → `{ memberId: null, isAdmin: false, gateReason: "rules_declined" }`
   - 全条件 OK → `isAdmin = isActiveAdmin(email)` を確認 → `{ memberId, isAdmin, gateReason: null }`

出力:
```json
{
  "memberId": "string | null",
  "isAdmin": "boolean",
  "gateReason": "unregistered | rules_declined | deleted | null"
}
```

## 5. session JWT 構造

```ts
type SessionJwtClaims = {
  sub: string;          // = memberId
  memberId: string;     // 不変条件 #7（responseId と分離）
  isAdmin: boolean;
  email: string;
  name?: string;
  iat: number;
  exp: number;          // iat + 24h
};
```

JWT に **載せないもの**（不変条件 #4/#11）:
- `profile` 本文（freeText 等）
- `responses` 配列
- `notes`（admin notes）
- `responseId`（不変条件 #7）
- `publicConsent` / `publishState`（公開判定は session 不要）

## 6. admin gate の二段防御

admin-gate-flow.md に詳細。

| 段 | 配置 | 失敗時動作 | 検出範囲 |
| --- | --- | --- | --- |
| 第1段（UI） | `apps/web/middleware.ts` | `/login?gate=admin_required` (302) | `/admin/*` 全ページ |
| 第2段（API） | `apps/api/src/middleware/requireAdmin.ts` | 401（無 token）/ 403（admin で無い） | `/admin/*` 全 endpoint |

両方を必須とする理由: middleware は edge で動くが、cookie 設定不全 / direct API call / 異なるドメインからの fetch 等で bypass されうる。API 側で最終防衛が必要。

## 7. env / secrets

secrets.md に詳細。

| 名前 | 用途 | 配置 |
| --- | --- | --- |
| `AUTH_SECRET` | JWT 署名鍵 (HS256, 256bit+) | Cloudflare Secrets |
| `AUTH_GOOGLE_ID` | OAuth client ID | Cloudflare Secrets |
| `AUTH_GOOGLE_SECRET` | OAuth client secret | Cloudflare Secrets |
| `AUTH_URL` | redirect base URL | wrangler vars |
| `INTERNAL_AUTH_SECRET` | apps/web→apps/api 内部認証 | Cloudflare Secrets（両 worker に同値） |
| `SYNC_ADMIN_TOKEN` (既存) | sync 系 cron 認証 | Cloudflare Secrets（変更無し） |

## 8. 05b との session 共有契約

**契約 A**: 両 provider（Google OAuth / Magic Link）の `signIn` callback は同じ `apps/api GET /auth/session-resolve` を呼ぶ。

**契約 B**: `SessionJwtClaims` の構造は provider 共通。`provider` claim は **載せない**（後で provider を切り替えても session 構造が変わらない）。

**契約 C**: `gateReason` の文字列は両 provider で共通: `"unregistered" | "rules_declined" | "deleted"`。05b で追加される `"sent"` `"input"` は session JWT に載らず、05b の `/me` endpoint がレスポンスとして返す（spec 06 の `AuthGateState`）。

**契約 D**: 同一 email で OAuth/Magic Link 両方ログインしても、解決される `memberId` が同一（AC-9）。これは session-resolve の出力が provider 不変であることで担保。

## 9. Cloudflare Edge runtime 互換性

| コンポーネント | Edge 互換 | 検証方針 |
| --- | --- | --- |
| `apps/web/middleware.ts` | ✅ | Auth.js v5 の `auth()` helper を呼ばず、`getToken({ secret })` で JWT のみ verify |
| Auth.js callback | ✅（@opennextjs/cloudflare 経由） | Node.js 互換 polyfill を使わない設定 |
| `fetch()` to apps/api | ✅ | global fetch 利用 |
| crypto subtle (JWT verify) | ✅ | Web Crypto API 利用 |

## 10. 多角的チェック

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | JWT HS256 + AUTH_SECRET 256bit 以上、TTL 24h | - |
| privacy | JWT に profile 本文 / notes / responses / responseId を載せない | #4, #7, #11 |
| 認可境界 | UI gate と API gate の二段防御 | #11 |
| dependency | session callback は apps/api 経由（D1 直接禁止） | #5 |
| Edge 互換 | middleware と Auth.js callback が edge で動く | - |
| 観測性 | OAuth callback / admin gate 拒否を audit_log に記録（07c hook） | - |
| 無料枠 | session storage 不要（JWT only） | #10 |
| 内部認証 | session-resolve endpoint は INTERNAL_AUTH_SECRET で保護 | #5（email 列挙防止） |

## 11. 4 条件再評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | session 構造と admin gate が UI/API の前提として確定 |
| 実現性 | PASS | Auth.js v5 + Cloudflare Workers + JWT は公式パターン |
| 整合性 | PASS | 05b と session-resolve endpoint を共有することで二重実装回避 |
| 運用性 | PASS | secrets / JWT / D1 row 不増加 |

## 12. サブタスク完了確認

- [x] Mermaid 図 → architecture.md
- [x] API contract → api-contract.md
- [x] admin gate 二段防御 → admin-gate-flow.md
- [x] env / secrets → secrets.md
- [x] 05b との contract → 本ファイル §8 と admin-gate-flow.md §session-sharing

## 13. 次 Phase に渡す引継ぎ

Phase 3（設計レビュー）で以下を判定:
- alternative A〜E の PASS-MINOR-MAJOR
- 採用案 A の理由 ADR
- 未解決事項 Q1〜Q5（特に session-resolve 認証方式）

## 関連成果物

- `outputs/phase-02/architecture.md` — Mermaid 構造図
- `outputs/phase-02/api-contract.md` — endpoint signature 一覧
- `outputs/phase-02/admin-gate-flow.md` — 二段防御の責務分離
- `outputs/phase-02/secrets.md` — env / secrets 表
