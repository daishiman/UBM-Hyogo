# Phase 5 — 実装ランブック: GoogleProvider / session callback / admin gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 5 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-04（テスト戦略） |
| 下流 | phase-06（異常系検証） |

## 目的

採用案 A を `apps/web` と `apps/api` に実装する手順を runbook + 擬似コード + sanity check + placeholder で記述する。本タスクは spec_created なのでコードは書かないが、別タスクで実装する人が手順通り実行できる粒度を保つ。

## 実行タスク

1. Google Cloud Console で OAuth client 取得手順
2. wrangler secret put による secrets 配線
3. apps/web Auth.js v5 GoogleProvider 設定（placeholder）
4. apps/web/middleware.ts admin gate（placeholder）
5. apps/api `GET /auth/session-resolve` endpoint（placeholder）
6. apps/api `requireAdmin` middleware（placeholder）
7. ESLint rule で apps/web → D1 阻止
8. sanity check（OAuth flow × admin/非 admin × 5 状態）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/api-contract.md | I/O |
| 必須 | outputs/phase-02/architecture.md | module 構成 |
| 必須 | outputs/phase-02/admin-gate-flow.md | 二段防御責務 |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 参考 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | secrets 配置 |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | identities / admin_users schema |

## 実行手順

### ステップ 1: Google Cloud Console で OAuth client 取得

| # | 操作 | 期待 |
| --- | --- | --- |
| O-01 | Google Cloud Console → API とサービス → 認証情報 → OAuth クライアント ID を作成 | OAuth 同意画面 + client 取得 |
| O-02 | アプリケーションタイプ: Web アプリケーション | - |
| O-03 | 承認済みリダイレクト URI: `https://<staging>.example.com/api/auth/callback/google` と production URI | callback URL 登録 |
| O-04 | client ID と client secret を 1Password に保存 | local 正本確保 |
| O-05 | 同意画面の testing user に内部関係者を登録（pre-prod） | テスト可能 |

### ステップ 2: wrangler secret put

```bash
# apps/web 用 (Cloudflare Workers binding)
echo "<random 64chars>" | wrangler pages secret put AUTH_SECRET --project-name ubm-hyogo-web
echo "<google-client-id>" | wrangler pages secret put GOOGLE_CLIENT_ID --project-name ubm-hyogo-web
echo "<google-client-secret>" | wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name ubm-hyogo-web

# apps/api 用 (Cloudflare Workers)
echo "<same-random-64chars>" | wrangler secret put AUTH_SECRET
```

### ステップ 3: apps/web Auth.js v5 設定（placeholder）

```ts
// apps/web/src/lib/auth.ts (placeholder)
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false
      const r = await fetch(`${process.env.AUTH_URL}/internal/auth/session-resolve?email=${encodeURIComponent(user.email!)}`, {
        headers: { "x-internal-token": process.env.INTERNAL_TOKEN! },
      })
      const me = await r.json() as { memberId: string | null; isAdmin: boolean; gateReason?: string }
      if (!me.memberId) {
        // /login?gate=<reason> へ redirect させる
        throw new Error(`AccessDenied:${me.gateReason ?? "unknown"}`)
      }
      ;(user as any).memberId = me.memberId
      ;(user as any).isAdmin = me.isAdmin
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.memberId = (user as any).memberId
        token.isAdmin = (user as any).isAdmin
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        memberId: token.memberId as string,
        isAdmin: token.isAdmin as boolean,
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
```

```ts
// apps/web/src/app/api/auth/[...nextauth]/route.ts (placeholder)
export { GET, POST } from "@/lib/auth"
```

### ステップ 4: apps/web/middleware.ts (placeholder)

```ts
// apps/web/middleware.ts (placeholder)
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isAdminPath = req.nextUrl.pathname.startsWith("/admin")
  if (!isAdminPath) return
  const isAdmin = (req.auth?.user as any)?.isAdmin === true
  if (!isAdmin) {
    const url = new URL("/login", req.url)
    url.searchParams.set("gate", "admin_required")
    return NextResponse.redirect(url)
  }
})

export const config = { matcher: ["/admin/:path*"] }
```

### ステップ 5: apps/api `GET /auth/session-resolve` (placeholder)

```ts
// apps/api/src/routes/auth/session-resolve.ts (placeholder)
import { Hono } from "hono"
import { findIdentityByEmail } from "@/repository/member-identity" // 02a
import { isAdminMember } from "@/repository/admin-user" // 02c

const app = new Hono<{ Bindings: Env }>()

app.get("/", async (c) => {
  if (c.req.header("x-internal-token") !== c.env.INTERNAL_TOKEN) {
    return c.json({ error: "forbidden" }, 403)
  }
  const email = c.req.query("email")
  if (!email) return c.json({ error: "validation" }, 422)

  const identity = await findIdentityByEmail(c.env.DB, email)
  if (!identity) return c.json({ memberId: null, isAdmin: false, gateReason: "unregistered" })
  if (identity.isDeleted) return c.json({ memberId: null, isAdmin: false, gateReason: "deleted" })
  if (identity.rulesConsent !== "consented") return c.json({ memberId: null, isAdmin: false, gateReason: "rules_declined" })

  const isAdmin = await isAdminMember(c.env.DB, identity.memberId)
  return c.json({ memberId: identity.memberId, isAdmin, gateReason: null })
})

export default app
```

### ステップ 6: apps/api `requireAdmin` middleware (placeholder)

```ts
// apps/api/src/middleware/require-admin.ts (placeholder)
import { createMiddleware } from "hono/factory"
import { verifyJwt } from "@ubm/shared/auth"

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: { memberId: string; isAdmin: boolean } }>(async (c, next) => {
  const token = c.req.header("authorization")?.replace(/^Bearer /, "")
    ?? c.req.cookie("authjs.session-token")
  if (!token) return c.json({ error: "unauthorized" }, 401)
  const claims = await verifyJwt(token, c.env.AUTH_SECRET)
  if (!claims) return c.json({ error: "unauthorized" }, 401)
  c.set("memberId", claims.memberId)
  c.set("isAdmin", claims.isAdmin)
  await next()
})

export const requireAdmin = createMiddleware<{ Variables: { memberId: string; isAdmin: boolean } }>(async (c, next) => {
  if (!c.get("isAdmin")) return c.json({ error: "forbidden" }, 403)
  await next()
})
```

### ステップ 7: ESLint rule で apps/web → D1 阻止

```js
// apps/web/.eslintrc.cjs (placeholder)
module.exports = {
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        { group: ["**/d1/**", "@cloudflare/workers-types"], message: "apps/web は D1 を直接触らない（apps/api 経由）" },
        { group: ["**/repository/**"], message: "repository は apps/api 専用" },
      ],
    }],
  },
}
```

### ステップ 8: sanity check

| # | 手順 | 期待 |
| --- | --- | --- |
| S-01 | `pnpm wrangler dev` で apps/api 起動 | port 8787 listen |
| S-02 | `pnpm dev` で apps/web 起動 | port 3000 listen |
| S-03 | seed で identity 無しの user → `/login` で Google OAuth → callback | `/login?gate=unregistered` redirect |
| S-04 | seed で is_deleted=1 の identity → OAuth | `/login?gate=deleted` redirect |
| S-05 | seed で rules_consent != consented → OAuth | `/login?gate=rules_declined` redirect |
| S-06 | seed で valid identity（admin_users 無し）→ OAuth | session 確立、`/profile` 表示 |
| S-07 | seed で valid identity + admin_users → OAuth | session 確立、`session.user.isAdmin === true` |
| S-08 | 一般 member の cookie で `/admin/dashboard` access | `/login?gate=admin_required` redirect |
| S-09 | 一般 member の JWT で `curl /admin/users` | `403 forbidden` |
| S-10 | admin の cookie で `/admin/dashboard` access | 表示 OK |
| S-11 | JWT を手で改ざんして `curl /admin/*` | `401 unauthorized` |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | sanity check で出た異常を再現する failure case |
| Phase 7 | runbook 完了条件 ↔ AC × test ID |
| 05b | session-resolve endpoint を共有 |
| 08a | contract test 実行で本 runbook の placeholder を活用 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #5 (apps/web → D1 禁止) | ステップ 7 ESLint rule で機械的に阻止、ステップ 5 の session-resolve 経由を強制 | #5 |
| #7 (memberId と responseId 分離) | jwt callback で `token.memberId` のみ積む（`responseId` は積まない） | #7 |
| #9 (`/no-access` 不在) | 拒否時 redirect 先が `/login?gate=...` のみ | #9 |
| #10 (無料枠) | session storage が JWT、D1 row 増なし | #10 |
| #11 (admin gate) | middleware + requireAdmin の二段防御 | #11 |
| secret hygiene | `AUTH_SECRET` `GOOGLE_CLIENT_SECRET` `INTERNAL_TOKEN` は `wrangler secret put` のみ。`.env` にも記載しない | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | OAuth client 取得手順 | 5 | pending | O-01〜O-05 |
| 2 | secrets 配線 | 5 | pending | wrangler secret put |
| 3 | Auth.js 設定 placeholder | 5 | pending | GoogleProvider |
| 4 | middleware placeholder | 5 | pending | edge runtime |
| 5 | session-resolve placeholder | 5 | pending | apps/api |
| 6 | requireAdmin placeholder | 5 | pending | apps/api |
| 7 | ESLint rule | 5 | pending | apps/web → D1 阻止 |
| 8 | sanity check | 5 | pending | S-01〜S-11 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | Phase 5 サマリ |
| ドキュメント | outputs/phase-05/runbook.md | 実装手順 + placeholder + sanity check |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] 8 サブタスクの placeholder が runbook に記載
- [ ] sanity check S-01〜S-11 が手順化
- [ ] ESLint rule placeholder が記載
- [ ] secret 取り扱いルールが明記
- [ ] OAuth client 取得手順が再現可能

## タスク100%実行確認【必須】

- 全 8 サブタスクが completed
- 2 種ドキュメント配置
- placeholder 内に実値（client_id / secret）が含まれていない
- 不変条件 #5, #7, #9, #10, #11 と対応する手順がある
- 次 Phase へ failure case の入力を整理

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: sanity check の各 S-XX を異常系の前提として渡す
- ブロック条件: runbook が placeholder のみで埋まっていない場合は進まない
