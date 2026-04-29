# API Contract — Magic Link & Gate State

すべて `apps/api`（Hono）に実装。`apps/web` は同 origin proxy のみで D1 を直接触らない（不変条件 #5）。
レスポンスは `application/json; charset=utf-8`。

## 1. 共通型（zod 草案）

```ts
// packages/shared/src/types/auth.ts
import { z } from "zod";

export const AuthGateStateZ = z.enum([
  "input", "sent", "unregistered", "rules_declined", "deleted",
]);
export type AuthGateState = z.infer<typeof AuthGateStateZ>;

export const EmailZ = z.string().trim().toLowerCase().email().max(254);

export const SessionUserZ = z.object({
  email: EmailZ,
  memberId: z.string().min(1),
  responseId: z.string().min(1),
  isAdmin: z.boolean(),
  authGateState: z.enum(["active", "rules_declined", "deleted"]),
});
export type SessionUser = z.infer<typeof SessionUserZ>;
```

備考: `AuthGateState` の `input` / `sent` は `/login` 画面の状態であり、`SessionUser.authGateState` には現れない（spec/06-member-auth.md L100-114）。

---

## 2. `POST /auth/magic-link`

ユーザーがメールアドレスを入力した際の入口。判定 + token 発行 + mail enqueue を 1 RTT で完了する。

### Request

| 項目 | 型 | 必須 | 備考 |
| --- | --- | --- | --- |
| body | `application/json` | ✓ | `{ email: string }` |

```ts
const MagicLinkRequestZ = z.object({ email: EmailZ });
```

### Response

gate 判定に関する結果は `200 OK` + body の `state` で行う（HTTP status を判別材料にしない → 列挙攻撃緩和）。mail provider 失敗や validation/rate-limit は運用検知のため HTTP error とする。

```ts
const MagicLinkResponseZ = z.object({
  state: z.enum(["sent", "unregistered", "rules_declined", "deleted"]),
});
```

| state | 副作用 | 関連 AC |
| --- | --- | --- |
| `sent` | `magic_tokens` INSERT 1 件 + mail enqueue 1 件 | AC-4 |
| `unregistered` | なし | AC-1 |
| `rules_declined` | なし | AC-2 |
| `deleted` | なし | AC-3 |

### Error Response

| HTTP | code | 条件 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | zod parse 失敗（malformed email、欠落） |
| 429 | `RATE_LIMITED` | 同 email > 5/1h or 同 IP > 30/1h |
| 502 | `MAIL_FAILED` | mail provider 不達（発行済み token は rollback） |

### 判定アルゴリズム

```text
1. validate body
2. rate-limit check (email, ip)
3. resolveGateState(email) → "unregistered" | "deleted" | "rules_declined" | "ok"
4. if "ok":
     row = magicTokens.issue({memberId, email, responseId, ttlSec: 900})
     mail.send(email, buildMagicLinkUrl(row.token, row.email))
     return { state: "sent" }
   else:
     return { state: <result> }
```

---

## 3. `GET /auth/gate-state`

`/login` 画面の preflight。token 発行の副作用なし。

### Request

| 項目 | 値 |
| --- | --- |
| query `email` | normalize 済み email（zod EmailZ） |

### Response

```ts
const GateStateResponseZ = z.object({
  state: z.enum(["unregistered", "rules_declined", "deleted", "ok"]),
});
```

`ok` は「ログイン可能（次に POST /auth/magic-link を呼んで sent を受ける）」の意味。`input`/`sent` は API では返さない（UI 内部状態）。

### Error Response

| HTTP | code | 条件 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | email malformed |
| 429 | `RATE_LIMITED` | 同 IP > 60/1h |

---

## 4. `POST /auth/magic-link/verify`（apps/api）

Magic Link token の検証 API。後続 06b の Auth.js Credentials Provider 相当 callback から server-to-server で呼ぶ。05b では EmailProvider と `[...nextauth]` route は導入しない。

### Request

| body | 用途 |
| --- | --- |
| `token` | hex 64 文字 |
| `email` | Magic Link 発行先 email |

### 振る舞い

| 結果 | HTTP | 振る舞い |
| --- | --- | --- |
| 検証成功 | 200 | `{ok:true,user}` |
| `expired` | 401 | `{ok:false,reason:"expired"}`（AC-5） |
| `already_used` | 401 | `{ok:false,reason:"already_used"}`（AC-6） |
| `not_found` | 401 | `{ok:false,reason:"not_found"}` |
| identity 解決失敗 | 401 | `{ok:false,reason:"resolve_failed"}`（AC-10、session 未発行） |

```ts
const VerifyRequestZ = z.object({
  token: z.string().regex(/^[0-9a-f]{64}$/),
  email: EmailZ,
});

const VerifyResponseZ = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    user: SessionUserZ,           // memberId, isAdmin 解決済み
  }),
  z.object({
    ok: z.literal(false),
    reason: z.enum(["not_found", "expired", "already_used", "resolve_failed"]),
  }),
]);
```

---

## 5. `POST /auth/resolve-session`（apps/api、Auth.js callback bridge 用）

Google OAuth（05a）と Magic Link で共有。session callback がこれを呼んで SessionUser を組み立てる。

### Request

```ts
const ResolveSessionRequestZ = z.object({ email: EmailZ });
```

### Response

```ts
const ResolveSessionResponseZ = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), user: SessionUserZ }),
  z.object({
    ok: z.literal(false),
    reason: z.enum(["unregistered", "rules_declined", "deleted"]),
  }),
]);
```

API は `ok=false` の場合 401 を返す。後続 06b の session callback はこれを session 未発行へ変換する（AC-10）。

---

## 6. AC ↔ API 契約 トレース

| AC | endpoint | 検証項目 |
| --- | --- | --- |
| AC-1 | POST /auth/magic-link | email 未登録 → state=unregistered, INSERT 0 件 |
| AC-2 | POST /auth/magic-link | rules_consent != consented → state=rules_declined, INSERT 0 件 |
| AC-3 | POST /auth/magic-link | is_deleted=true → state=deleted, INSERT 0 件 |
| AC-4 | POST /auth/magic-link | 全条件 OK → INSERT 1 件 + mail enqueue + state=sent |
| AC-5 | POST /auth/magic-link/verify | expires_at < now → 401 `{ok:false, reason:"expired"}` |
| AC-6 | POST /auth/magic-link/verify | used=1 → 401 `{ok:false, reason:"already_used"}` |
| AC-7 | (fs check) | `apps/web/app/no-access` 不在 |
| AC-8 | (gitleaks) | secret 平文不在 |
| AC-9 | 全 endpoint | 5 状態すべての契約 test pass（08a） |
| AC-10 | POST /auth/resolve-session | identity 未解決時 ok=false → session 未発行 |

---

## 7. 同 origin proxy 仕様（apps/web）

`apps/web/app/api/auth/magic-link/route.ts`:

- `POST` のみ受け付ける
- body をそのまま `${INTERNAL_API_BASE_URL}/auth/magic-link` へ forward
- response（status + body）をそのまま返す
- D1 binding は wrangler.toml で `apps/web` に渡さない（不変条件 #5）

`apps/web/app/api/auth/gate-state/route.ts`: 同様の GET proxy。

---

## 8. レートリミット仕様（暫定）

| key | window | limit | 実装 |
| --- | --- | --- | --- |
| `magic-link:email:<sha256(email)>` | 1h | 5 | Workers isolate memory（MVP） |
| `magic-link:ip:<ip>` | 1h | 30 | Workers isolate memory（MVP） |
| `gate-state:ip:<ip>` | 1h | 60 | Workers isolate memory（MVP） |

> MVP 実装は isolate local memory のため、複数 isolate 間では厳密な共有 rate limit ではない。KV / Durable Object / WAF 昇格は `unassigned-task-detection.md` の U-02 で管理する。
