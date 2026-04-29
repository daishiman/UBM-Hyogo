# api-contract.md — endpoint signature 一覧

## Auth.js 標準 endpoint（apps/web）

すべて `apps/web/src/app/api/auth/[...nextauth]/route.ts` から自動 export。

| Method | Path | 役割 |
| --- | --- | --- |
| GET / POST | `/api/auth/signin/google` | OAuth フロー開始 |
| GET | `/api/auth/callback/google` | Google からの callback |
| GET | `/api/auth/session` | 現在の session JSON |
| POST | `/api/auth/signout` | sign-out |
| GET | `/api/auth/csrf` | CSRF token |

## カスタム endpoint（apps/api）

### `GET /auth/session-resolve?email=<email>`

session callback 専用の内部 endpoint。**外部公開しない**（INTERNAL_AUTH_SECRET 必須）。

#### Request

```
GET /auth/session-resolve?email=foo@example.com
Headers:
  X-Internal-Auth: <INTERNAL_AUTH_SECRET>
```

#### Response (200)

```json
{
  "memberId": "mbr_01HXYZ...",
  "isAdmin": false,
  "gateReason": null
}
```

または

```json
{
  "memberId": null,
  "isAdmin": false,
  "gateReason": "unregistered"
}
```

#### gateReason 列挙

| 値 | 条件 |
| --- | --- |
| `"unregistered"` | `member_identities` に email 該当無し |
| `"deleted"` | `member_status.is_deleted = true` |
| `"rules_declined"` | `member_status.rules_consent !== "consented"` |
| `null` | 全条件 OK（session 発行可能） |

#### Errors

| status | 条件 |
| --- | --- |
| 400 | `email` query 欠落 / 形式不正 |
| 401 | `X-Internal-Auth` header 不一致 |
| 500 | D1 query 失敗 |

#### 擬似コード

```ts
// apps/api/src/routes/auth.ts
import { Hono } from "hono";
import { internalAuth } from "../middleware/internal-auth";
import { findIdentityWithStatusByEmail } from "../repository/identities";
import { isActiveAdmin } from "../repository/adminUsers";

export const authRoutes = new Hono<{ Bindings: ApiBindings }>()
  .use("*", internalAuth)
  .get("/session-resolve", async (c) => {
    const email = c.req.query("email");
    if (!email) return c.json({ error: "email required" }, 400);
    const normalized = email.trim().toLowerCase();

    const row = await findIdentityWithStatusByEmail({ db: c.env.DB }, normalized);
    if (!row) {
      return c.json({ memberId: null, isAdmin: false, gateReason: "unregistered" });
    }
    if (row.status.is_deleted) {
      return c.json({ memberId: null, isAdmin: false, gateReason: "deleted" });
    }
    if (row.status.rules_consent !== "consented") {
      return c.json({ memberId: null, isAdmin: false, gateReason: "rules_declined" });
    }
    const isAdmin = await isActiveAdmin({ db: c.env.DB }, normalized);
    return c.json({ memberId: row.identity.memberId, isAdmin, gateReason: null });
  });
```

> `findIdentityWithStatusByEmail` は本タスクで `apps/api/src/repository/identities.ts` に追加するか、`auth.ts` 内で SQL を直接書く（既存 `findIdentityByEmail` は status を join していない）。Phase 5 で確定。

### `internal-auth` middleware

```ts
// apps/api/src/middleware/internal-auth.ts
export interface InternalAuthEnv {
  INTERNAL_AUTH_SECRET: string;
}

export const internalAuth: MiddlewareHandler<{ Bindings: InternalAuthEnv }> = async (c, next) => {
  const expected = c.env.INTERNAL_AUTH_SECRET;
  if (!expected) return c.json({ error: "internal misconfigured" }, 500);
  const got = c.req.header("x-internal-auth");
  if (got !== expected) return c.json({ error: "unauthorized" }, 401);
  await next();
};
```

## Auth.js callbacks（apps/web/src/lib/auth.ts）

### `signIn`

| 入力 | 型 |
| --- | --- |
| `user` | `{ email: string; name?: string }` |
| `account` | `{ provider: "google" \| "credentials"; providerAccountId: string }` |
| `profile` | `{ email_verified: boolean; ... }` |

| 出力 | 意味 |
| --- | --- |
| `true` | session 発行 |
| `false` / string (URL) | redirect / session 不発行 |

### `jwt`

| 入力 | 型 |
| --- | --- |
| `token` | 既存 JWT claim |
| `user` | 初回サインイン時のみ存在 |

出力: 拡張済み token

```ts
{
  sub: memberId,
  memberId,
  isAdmin,
  email,
  name,
  iat,
  exp, // 24h
}
```

### `session`

| 入力 | 型 |
| --- | --- |
| `session` | Auth.js 既定 session |
| `token` | jwt callback 出力 |

出力: `{ user: SessionUser, expires: ISOString }`

## SessionUser 型（packages/shared/src/auth.ts）

```ts
export type MemberId = string & { readonly __brand: "MemberId" };

export interface SessionUser {
  readonly memberId: MemberId;
  readonly email: string;
  readonly name?: string;
  readonly isAdmin: boolean;
}

export interface SessionJwtClaims {
  readonly sub: string;
  readonly memberId: MemberId;
  readonly isAdmin: boolean;
  readonly email: string;
  readonly name?: string;
  readonly iat: number;
  readonly exp: number;
}

export type GateReason = "unregistered" | "rules_declined" | "deleted";

export interface SessionResolveResponse {
  readonly memberId: MemberId | null;
  readonly isAdmin: boolean;
  readonly gateReason: GateReason | null;
}
```

## 既存 endpoint への影響

| endpoint | 既存 middleware | 変更後 |
| --- | --- | --- |
| `/admin/members` 系（04c） | `adminGate` (Bearer SYNC_ADMIN_TOKEN) | `requireAdmin` (JWT + admin_users) |
| `/admin/tags` 系（04c） | 同上 | 同上 |
| `/admin/schema` 系（04c） | 同上 | 同上 |
| `/admin/meetings` 系（04c） | 同上 | 同上 |
| `/sync/schema-pull` 等 cron | `adminGate` (Bearer SYNC_ADMIN_TOKEN) | `requireSyncAdmin`（rename, 既存挙動維持） |
| `/me/*` 系（04b） | 想定: `requireAuth` | `requireAuth`（本タスクで実装） |

> 04c の Phase 13 完了済 endpoint への middleware 差し替えは、Phase 5 ランブックで `app.use("/admin/*", requireAdmin)` を `apps/api/src/index.ts` に追加することで一括適用。

## contract test 要件（Phase 4 で詳細化）

| AC | test 観点 |
| --- | --- |
| AC-2 | session-resolve が unregistered email に `gateReason: "unregistered"` を返す |
| AC-3 | admin email に対して `isAdmin: true` を返す |
| AC-5 | `/admin/*` API へ無 token / 非 admin token / valid admin token の 3 ケース |
| AC-8 | JWT 改ざん（payload を base64 manipulate）→ 401 |
| AC-9 | 同一 email の Google / Magic Link で同一 memberId（05b と統合 test） |
