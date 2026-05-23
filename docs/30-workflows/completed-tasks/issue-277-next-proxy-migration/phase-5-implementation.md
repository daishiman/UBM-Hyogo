# Phase 5: 実装手順

## 前提

- ブランチ: `feat/issue-277-next-proxy-migration`
- 作業ディレクトリ: `apps/web/`
- Node 24 / pnpm 10（`mise exec --` 経由）

## 実装ステップ

### Step 1: codemod 実行

```bash
cd apps/web
mise exec -- npx -y @next/codemod@canary middleware-to-proxy .
```

期待 diff:
- `apps/web/middleware.ts` 削除
- `apps/web/proxy.ts` 新規作成（中身は middleware.ts と同一、function 名のみ `middleware` → `proxy`）

`git diff` で内容差分を確認し、想定通り（function 名以外の変更が無い）であることを保証する。

### Step 2: 手動微調整

codemod が `export default middleware;` を残している場合は `export default proxy;` に書き換える。
JSDoc / コメント中の `middleware` 表記も `proxy` に置換（ロジックには影響しない範囲）。

期待最終形（`apps/web/proxy.ts`）:

```ts
// 05a + 06b: 認証 proxy（edge runtime, 二段防御の第1段）。
// matcher: /admin/:path*, /profile/:path*
import { NextResponse, type NextRequest } from "next/server";
import { decodeAuthSessionJwt } from "@ubm-hyogo/shared";

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const;

const buildAdminLoginRedirect = (req: NextRequest): NextResponse => {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("gate", "admin_required");
  return NextResponse.redirect(url);
};

const buildProfileLoginRedirect = (req: NextRequest): NextResponse => {
  const original = req.nextUrl.pathname + req.nextUrl.search;
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("redirect", original);
  return NextResponse.redirect(url);
};

const authSecret = (req: NextRequest): string =>
  req.headers.get("x-ubm-auth-secret") ??
  (typeof process === "undefined" ? "" : process.env["AUTH_SECRET"] ?? "");

const sessionToken = (req: NextRequest): string | undefined => {
  for (const name of SESSION_COOKIE_NAMES) {
    const value = req.cookies.get(name)?.value;
    if (value) return value;
  }
  return undefined;
};

const guardedProxy = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const claims = await decodeAuthSessionJwt(authSecret(req), sessionToken(req));

  if (pathname.startsWith("/admin")) {
    if (!claims) return buildAdminLoginRedirect(req);
    if (!claims.isAdmin) {
      return new NextResponse("Forbidden", {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.next();
  }
  if (pathname.startsWith("/profile")) {
    if (!claims) return buildProfileLoginRedirect(req);
    return NextResponse.next();
  }
  return NextResponse.next();
};

export async function proxy(req: NextRequest) {
  return guardedProxy(req);
}

export default proxy;

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
```

### Step 3: コメント更新

`apps/web/app/(admin)/layout.tsx:3` のコメントを更新:

```diff
-// middleware.ts は配置しない（layout 内 auth() で完結、Edge cost 削減）。
+// proxy.ts は配置しない（root proxy.ts と layout 内 auth() で完結、Edge cost 削減）。
```

### Step 4: 静的検証

```bash
cd <repo-root>
mise exec -- pnpm install   # 念のため
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee /tmp/issue-277-build.log
grep -i 'middleware.*deprecated' /tmp/issue-277-build.log && echo "FAIL: deprecation still present" || echo "OK: no deprecation warning"
```

### Step 5: ローカル smoke

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# 別シェルで
curl -i -L --max-redirs 0 http://localhost:3000/profile  | head
curl -i -L --max-redirs 0 http://localhost:3000/admin    | head
```

期待:
- `/profile` → `307`、`location: /login?redirect=%2Fprofile`
- `/admin` → `307`、`location: /login?gate=admin_required`

## ロールバック

`git restore apps/web/middleware.ts apps/web/app/\(admin\)/layout.tsx && git clean -f apps/web/proxy.ts` で元に戻る。

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 5 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

codemod と手動確認で、振る舞い変更なしの proxy rename を実行可能にする。

## 実行タスク

- `@next/codemod middleware-to-proxy` を実行する。
- default export / comment / stale reference を確認する。
- typecheck / lint / build / smoke を実行する。

## 参照資料

- Phase 2 設計。
- Next.js proxy migration docs。
- `apps/web/middleware.ts`

## 成果物

- `apps/web/proxy.ts`
- `apps/web/app/(admin)/layout.tsx` comment update
- local verification logs under Phase 11 after implementation

## 完了条件

- `apps/web/middleware.ts` が削除され、`apps/web/proxy.ts` が存在する。
- build log に middleware deprecation warning が出ない。

## 統合テスト連携

Phase 6 の proxy spec と Phase 11 smoke を実装後に実行する。
