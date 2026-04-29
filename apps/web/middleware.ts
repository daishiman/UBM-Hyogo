// 05a: admin gate 二段防御の第1段（UI gate, edge runtime）。
// matcher: /admin/:path*
//
// - 未ログイン → /login?gate=admin_required
// - ログイン済 だが isAdmin=false → /login?gate=admin_required
// - ログイン済 + isAdmin=true → next()
//
// 不変条件 #5: 本 middleware では D1 を一切触らない（JWT verify のみ）。
// 不変条件 #9: `/no-access` 専用画面に依存せず /login?gate=... に redirect。
// 不変条件 #11: admin 画面 HTML を未認証 / 非 admin に SSR させない。
//
// 第2段は API 側の requireAdmin middleware。
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "./src/lib/auth";

const buildLoginRedirect = (req: NextRequest): NextResponse => {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("gate", "admin_required");
  return NextResponse.redirect(url);
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  const user = req.auth?.user as { isAdmin?: boolean } | undefined;
  if (!user || user.isAdmin !== true) {
    return buildLoginRedirect(req as unknown as NextRequest);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
