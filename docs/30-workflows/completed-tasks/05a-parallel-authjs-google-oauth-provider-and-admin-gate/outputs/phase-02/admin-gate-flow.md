# admin-gate-flow.md — admin gate 二段防御の責務分離

## 二段防御の必要性

UI 層 (`apps/web/middleware.ts`) のみだと以下のケースで bypass されうる:
- 直接 `apps/api` の `/admin/*` を叩く（fetch / curl）
- middleware が edge runtime でランタイムエラーを起こした場合の fail-open
- middleware の matcher 設定漏れ（新規 `/admin/sub-path` 追加時の事故）

API 層 (`apps/api/requireAdmin`) のみだと以下のリスクがある:
- 非 admin ユーザーに admin 画面の HTML 構造（メニュー / コンポーネント名）が露出
- Server Component の SSR 時に admin 専用データ取得 API が呼ばれて 403 になり、エラーバウンダリで「admin 機能の存在」自体が漏洩
- 不変条件 #11（管理者操作の境界）を SSR の段階で守れない

両方を必須とすることで、`/admin/*` が UI / API どちらの経路でも非 admin に晒されない。

## 責務分離マトリクス

| 観点 | UI gate (`apps/web/middleware.ts`) | API gate (`apps/api/requireAdmin`) |
| --- | --- | --- |
| 配置 | apps/web edge runtime | apps/api Hono middleware |
| matcher | `/admin/:path*` | `app.use("/admin/*", requireAdmin)` |
| トークン入手元 | cookie (`__Secure-next-auth.session-token` 等) | cookie 同上 OR `Authorization: Bearer <jwt>` |
| 検証手段 | `getToken({ secret: AUTH_SECRET })` | `verifyJwt(jwt, AUTH_SECRET)`（packages/shared） |
| 失敗時 | 302 `/login?gate=admin_required` | 401（無 token / verify fail）, 403（admin で無い） |
| 観測 | 監査 log には書かない（UI redirect は通常動線） | 403 は audit_log に actor=null, action="admin_gate_denied" で記録（07c hook） |
| Edge 互換 | ✅ 必須（edge runtime） | apps/api 自体が edge worker のため自動 |
| bypass 防止 | matcher を `/admin/:path*` で全配下にかける | `app.use` を `/admin/*` ルート登録より前に配置 |

## UI gate (middleware.ts) 設計

### 擬似コード

```ts
// apps/web/middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("gate", "admin_required");
    return NextResponse.redirect(url);
  }

  if (!token.isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("gate", "admin_required");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

### 不変条件マッピング

| # | 対応 |
| --- | --- |
| #9 | `/no-access` ではなく `/login?gate=admin_required` に飛ばす |
| #11 | admin 画面 HTML 構造の露出を未認証時点で阻止 |
| #5 | middleware では D1 を一切触らない（JWT verify のみ） |

## API gate (requireAdmin) 設計

### 擬似コード

```ts
// apps/api/src/middleware/requireAuth.ts
import type { MiddlewareHandler } from "hono";
import { verifyJwt } from "@repo/shared/auth";

export interface AuthEnv {
  AUTH_SECRET: string;
}

export const requireAuth: MiddlewareHandler<{ Bindings: AuthEnv }> = async (c, next) => {
  const token = extractJwt(c.req); // cookie or Authorization: Bearer
  if (!token) return c.json({ error: "unauthorized" }, 401);

  const claims = await verifyJwt(token, c.env.AUTH_SECRET);
  if (!claims) return c.json({ error: "unauthorized" }, 401);

  c.set("user", {
    memberId: claims.memberId,
    isAdmin: claims.isAdmin,
    email: claims.email,
    name: claims.name,
  });
  await next();
};

// apps/api/src/middleware/requireAdmin.ts
export const requireAdmin: MiddlewareHandler<{ Bindings: AuthEnv }> = async (c, next) => {
  return requireAuth(c, async () => {
    const user = c.get("user") as SessionUser | undefined;
    if (!user || !user.isAdmin) {
      // audit log hook (07c)
      return c.json({ error: "forbidden" }, 403);
    }
    await next();
  });
};
```

### `extractJwt` 詳細

```ts
function extractJwt(req: HonoRequest): string | null {
  // 1) cookie 経由
  const cookieHeader = req.header("cookie") ?? "";
  const sessionCookieName = "__Secure-authjs.session-token"; // production
  const fallbackCookieName = "authjs.session-token";         // dev
  const fromCookie =
    parseCookie(cookieHeader, sessionCookieName) ??
    parseCookie(cookieHeader, fallbackCookieName);
  if (fromCookie) return fromCookie;

  // 2) Authorization: Bearer
  const auth = req.header("authorization") ?? "";
  if (auth.startsWith("Bearer ")) return auth.slice("Bearer ".length);

  return null;
}
```

### 不変条件マッピング

| # | 対応 |
| --- | --- |
| #11 | API レベルで isAdmin 必須。bypass 不可 |
| #5 | requireAdmin 内で D1 lookup しない（JWT claim のみ信頼）。lookup は session 発行時に session-resolve で済ませる |
| #7 | claim は memberId のみ。responseId は読み込まない |

## 二段防御の重複検証

| 攻撃シナリオ | UI gate 単独で防げるか | API gate 単独で防げるか | 両方で防げるか |
| --- | --- | --- | --- |
| 非 admin が `/admin/members` を直接ブラウザで開く | ✅ 302 redirect | ❌（HTML は SSR されうる） | ✅ |
| 非 admin が `apps/api/admin/members` を curl | ❌（middleware は apps/web のみ） | ✅ 403 | ✅ |
| middleware の matcher が `/admin/:path*` 漏れ | ❌（漏れ範囲が露出） | ✅ 403 | ✅ |
| 非 admin に admin 機能の存在を隠す | ✅ HTML 露出無し | ❌（403 エラーから推測可能） | ✅ |
| JWT 改ざんによる isAdmin=true 偽装 | ✅ getToken が verify | ✅ verifyJwt が verify | ✅ |
| 期限切れ JWT | ✅ getToken が exp 検証 | ✅ verifyJwt が exp 検証 | ✅ |

## sync 系 endpoint との分離

既存 `apps/api/src/middleware/admin-gate.ts`（Bearer SYNC_ADMIN_TOKEN）は **cron による schema sync / response sync 起動** 専用。Phase 5 で次のように整理:

| 用途 | middleware | 認証方式 |
| --- | --- | --- |
| 人間の admin 操作（`/admin/members` 等） | `requireAdmin` | JWT + admin_users lookup |
| cron / 自動化系（`/sync/schema-pull` 等） | `requireSyncAdmin` (rename) | Bearer SYNC_ADMIN_TOKEN（既存維持） |

**根拠**: cron トリガーは人間の email を持たないため admin_users 照合不能。専用 token で隔離。

## 05b との session 共有契約（再掲）

両 provider は同じ JWT 構造を返すため、**`requireAuth` / `requireAdmin` は provider 不問で動作**する。05b で Magic Link callback が完成しても、admin gate は変更不要。

## 観測性 hook

| イベント | フック先 | データ |
| --- | --- | --- |
| OAuth signIn 失敗 (gateReason !== null) | apps/web logger | `{ email_hash, gateReason }`（email は hash のみ） |
| middleware redirect | なし | 通常動線のため log しない |
| requireAuth 401 | audit_log via 07c | `{ actor: null, action: "auth_unauthorized", target: path }` |
| requireAdmin 403 | audit_log via 07c | `{ actor: memberId, action: "admin_gate_denied", target: path }` |

> 07c の audit_log 連携は本タスクでは hook ポイントのみ確保。実装は 07c タスク。
