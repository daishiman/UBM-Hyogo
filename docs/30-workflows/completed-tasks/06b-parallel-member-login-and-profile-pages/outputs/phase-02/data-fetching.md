# データ取得 + middleware 設計

## `/login` の searchParams parse

```ts
import { z } from "zod"
const loginQuerySchema = z.object({
  state: z.enum(["input","sent","unregistered","rules_declined","deleted"]).default("input"),
  email: z.string().email().optional(),
  redirect: z.string().startsWith("/").default("/profile"),
})
```

## `/profile` の Server fetch

```ts
const [me, profile] = await Promise.all([
  fetchAuthed<MeView>("/me"),
  fetchAuthed<MemberProfile>("/me/profile"),
])
```

## fetch / revalidate 表

| 場所 | 方法 | revalidate |
| --- | --- | --- |
| `/login` | RSC + searchParams（fetch なし） | static (no fetch) |
| `/profile` | RSC + Auth.js session cookie 転送 + 04b fetch | `0`（dynamic、session ベース） |
| `/profile` 参加履歴 | 04b の `/me` 含み | 0 |

## session middleware

```ts
// apps/web/middleware.ts
export async function middleware(req) {
  const url = new URL(req.url)
  if (url.pathname.startsWith("/profile")) {
    const session = await getSession(req)
    if (!session) {
      const redirect = `/login?redirect=${encodeURIComponent(url.pathname)}`
      return NextResponse.redirect(new URL(redirect, req.url))
    }
  }
}
export const config = { matcher: ["/profile/:path*"] }
```

## env

| 変数 | 種別 | 用途 |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | var | apps/api ベース URL |
| `AUTH_URL` | var | Auth.js base URL（05a/b 共有） |
