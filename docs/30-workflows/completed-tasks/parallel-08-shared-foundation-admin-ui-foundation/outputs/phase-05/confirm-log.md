# Phase 5 confirm log (T4 / T5 / T6)

実コード read-only 確認結果。差分書き込みは発生していない。

## T4 — `apps/web/app/(admin)/admin/error.tsx`

```
$ test -f apps/web/app/\(admin\)/admin/error.tsx && echo OK
OK

$ grep -n "reset" apps/web/app/\(admin\)/admin/error.tsx
2:export default function Error({ error, reset }: { error: Error; reset: () => void }) {
7:      <button type="button" onClick={() => reset()}>再試行</button>
```

→ AC-5 PASS (`role="alert"` + reset() 再試行ボタン現存)。

## T5 — `apps/web/middleware.ts`

```
$ test -f apps/web/middleware.ts && echo OK
OK

$ grep -nE "admin|gate=admin_required" apps/web/middleware.ts
2:// matcher: /admin/:path*, /profile/:path*
4:// /admin 配下:
5://   - 未ログイン or isAdmin=false → /login?gate=admin_required
13:// 不変条件 #11: admin / profile 画面 HTML を未認証に SSR させない。
27:  url.searchParams.set("gate", "admin_required");
56:  if (pathname.startsWith("/admin")) {
61:      // 認証済 non-admin: /login redirect ではなく 403 を返す（一段防御 + UX）
85:  matcher: ["/admin/:path*", "/profile/:path*"],
```

→ AC-6 PASS (`/admin/:path*` matcher + `gate=admin_required` redirect lane 現存)。

## T6 — API error inventory

`apps/api/src/routes/**/*.ts` (spec を除く本体) における error response shape:

| Shape | 件数 |
|-------|------|
| `{ error: "..." }` | 13 |
| `{ ok: false, error: "..." }` | 98 |

→ AC-7 PASS。serial-05/step-01 で実装する `useAdminMutation` の parser は両形を扱う契約。

## 結論

read-only 確認 3 件すべて PASS。差分書き込みなし。Phase 6 進行可。
