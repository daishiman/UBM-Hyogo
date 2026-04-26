# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

採用案 A を `apps/web` と `apps/api` に実装する手順を runbook + 擬似コード + sanity check + placeholder で記述する。本タスクは spec_created なのでコードは書かないが、別タスクで実装する人が手順通り実行できる粒度を保つ。

## 実行タスク

1. apps/api Hono ルート追加（POST / GET / callback proxy 経路）
2. apps/web Auth.js EmailProvider 設定
3. magic_tokens 操作（02c repository を呼ぶ）
4. mail provider 配線
5. session callback で memberId / isAdmin 解決
6. ESLint rule で apps/web → D1 阻止
7. sanity check（5 状態 × ローカル wrangler dev）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/api-contract.md | I/O |
| 必須 | outputs/phase-02/architecture.md | module 構成 |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | magic_tokens schema |

## 実行手順

### ステップ 1: apps/api ルート追加

```ts
// apps/api/src/routes/auth/magic-link.ts (placeholder)
import { Hono } from "hono"
import { resolveGateState } from "@/services/auth/gate-state-resolver"
import { issueMagicToken } from "@/services/auth/magic-token-issuer"
import { z } from "zod"

const app = new Hono<{ Bindings: Env }>()

const reqSchema = z.object({ email: z.string().email() })

app.post("/", async (c) => {
  const body = reqSchema.parse(await c.req.json())
  const state = await resolveGateState(body.email, c.env.DB)
  if (state !== "ok") return c.json({ state })
  await issueMagicToken({
    email: body.email,
    db: c.env.DB,
    mailKey: c.env.MAIL_PROVIDER_KEY,
    authSecret: c.env.AUTH_SECRET,
    ttlMinutes: 15,
  })
  return c.json({ state: "sent" })
})

export default app
```

```ts
// apps/api/src/routes/auth/gate-state.ts (placeholder)
app.get("/", async (c) => {
  const email = c.req.query("email")
  const state = await resolveGateState(email!, c.env.DB)
  return c.json({ state: state === "ok" ? "input" : state })
})
```

### ステップ 2: gate-state-resolver

```ts
// apps/api/src/services/auth/gate-state-resolver.ts (placeholder)
export async function resolveGateState(email: string, db: D1Database) {
  const id = await db.prepare("SELECT member_id FROM member_identities WHERE response_email = ?")
    .bind(email).first<{ member_id: string }>()
  if (!id) return "unregistered" as const
  const status = await db.prepare(
    "SELECT rules_consent, is_deleted FROM member_status WHERE member_id = ?"
  ).bind(id.member_id).first<{ rules_consent: string; is_deleted: number }>()
  if (status?.is_deleted) return "deleted" as const
  if (status?.rules_consent !== "consented") return "rules_declined" as const
  return "ok" as const
}
```

### ステップ 3: magic-token-issuer

```ts
// apps/api/src/services/auth/magic-token-issuer.ts (placeholder)
export async function issueMagicToken(args: {
  email: string; db: D1Database; mailKey: string; authSecret: string; ttlMinutes: number;
}) {
  const tokenRaw = crypto.getRandomValues(new Uint8Array(32))
  const token = base64url(tokenRaw)
  const tokenHash = await sha256(token + args.authSecret)
  const expiresAt = Date.now() + args.ttlMinutes * 60 * 1000
  await args.db.prepare(
    "INSERT INTO magic_tokens (token_hash, email, expires_at, used_at) VALUES (?,?,?,NULL)"
  ).bind(tokenHash, args.email, expiresAt).run()
  await sendMagicLinkMail({ to: args.email, token, mailKey: args.mailKey })
}
```

### ステップ 4: Auth.js EmailProvider

```ts
// apps/web/lib/auth/config.ts (placeholder)
import NextAuth from "next-auth"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({ /* 05a 担当 */ }),
    EmailProvider({
      // sendVerificationRequest は使わない（自前 issuer 経由）
      // verify は callback で使う標準 token を別経路で発行するため
      // ここでは server を null にして「Auth.js のみ verify を担当」
      maxAge: 15 * 60,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // memberId / isAdmin を解決して session に積む
      const r = await fetch(`${process.env.AUTH_URL}/internal/me-by-email?email=${session.user.email}`)
      const me = await r.json()
      return { ...session, memberId: me.memberId, isAdmin: me.isAdmin }
    },
  },
})
```

### ステップ 5: ESLint rule で apps/web → D1 禁止

```js
// .eslintrc.* (placeholder)
{
  rules: {
    "no-restricted-imports": ["error", {
      paths: [
        { name: "wrangler", message: "apps/web は D1 を直接触らない（apps/api 経由）" },
      ],
      patterns: [
        { group: ["**/d1/**"], message: "apps/web から D1 直接アクセス禁止" },
      ],
    }],
  },
}
```

### ステップ 6: sanity check

| # | 手順 | 期待 |
| --- | --- | --- |
| S-01 | `pnpm wrangler dev` で apps/api を起動 | port 8787 listen |
| S-02 | `curl -X POST http://localhost:8787/auth/magic-link -d '{"email":"unknown@example.com"}'` | `{"state":"unregistered"}` |
| S-03 | seed で deleted member を作り、その email で curl | `{"state":"deleted"}` |
| S-04 | seed で rules_consent != consented を作る | `{"state":"rules_declined"}` |
| S-05 | seed で valid member を作る | `{"state":"sent"}`、magic_tokens に 1 行 insert |
| S-06 | `apps/web/app/no-access/` 配下が存在しないことを `find` で確認 | 0 件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | sanity check で出た異常を再現する failure case |
| Phase 7 | runbook 完了条件 ↔ AC × test ID |
| 08a | contract test 実行で本 runbook の placeholder を活用 |

## 多角的チェック観点

- 不変条件 #5: ESLint rule（ステップ 5）で機械的に阻止
- 不変条件 #9: S-06 で `/no-access` 不在を確認
- 不変条件 #10: token TTL 15 分 + sweep 不要設計で D1 writes を最小化
- secret hygiene: `AUTH_SECRET` `MAIL_PROVIDER_KEY` は `wrangler secret put` のみ。`.env` にも記載しない

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | apps/api ルート追加 | 5 | pending | 3 endpoints |
| 2 | gate-state-resolver | 5 | pending | 純関数 |
| 3 | magic-token-issuer / verifier | 5 | pending | crypto + mail |
| 4 | Auth.js 設定 | 5 | pending | EmailProvider |
| 5 | session callback | 5 | pending | memberId / isAdmin |
| 6 | ESLint rule | 5 | pending | apps/web → D1 阻止 |
| 7 | sanity check | 5 | pending | S-01〜S-06 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | Phase 5 サマリ |
| ドキュメント | outputs/phase-05/runbook.md | 実装手順 + placeholder + sanity check |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] 7 サブタスクの placeholder が runbook に記載
- [ ] sanity check S-01〜S-06 が手順化
- [ ] ESLint rule placeholder が記載
- [ ] secret 取り扱いルールが明記

## タスク100%実行確認【必須】

- 全 7 サブタスクが completed
- 2 種ドキュメント配置
- placeholder 内に実値（key 等）が含まれていない
- 不変条件 #5, #9, #10 と対応する手順がある
- 次 Phase へ failure case の入力を整理

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: sanity check の各 S-XX を異常系の前提として渡す
- ブロック条件: runbook が placeholder のみで埋まっていない場合は進まない
