// 05a + 06b: 認証 middleware（edge runtime, 二段防御の第1段）。
// matcher: /admin/:path*, /profile/:path*
//
// /admin 配下:
//   - 未ログイン or isAdmin=false → /login?gate=admin_required
//   - ログイン済 + isAdmin=true → next()
// /profile 配下（06b 追加）:
//   - 未ログイン → /login?redirect=<元path>
//   - ログイン済 → next()（rules_declined / deleted は API 層で 410 / state 解決）
//
// 不変条件 #5: D1 は触らない（JWT verify のみ）。
// 不変条件 #9: `/no-access` 専用画面に依存せず /login?... に redirect。
// 不変条件 #11: admin / profile 画面 HTML を未認証に SSR させない。
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "./src/lib/auth";

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

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const nReq = req as unknown as NextRequest;
  if (pathname.startsWith("/admin")) {
    const user = req.auth?.user as { isAdmin?: boolean } | undefined;
    if (!user || user.isAdmin !== true) {
      return buildAdminLoginRedirect(nReq);
    }
    return NextResponse.next();
  }
  if (pathname.startsWith("/profile")) {
    if (!req.auth) {
      return buildProfileLoginRedirect(nReq);
    }
    return NextResponse.next();
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
