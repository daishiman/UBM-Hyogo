# Phase 11 — Grep Gate Evidence

実行日: 2026-05-22

## G-1: serial-05 marker (16 page routes)

全 16 route の page.tsx に `// serial-05: <route> — blueprint 09[efg]:LLL-MMM` コメントを確認:

```
apps/web/app/page.tsx                                       09e:67-160
apps/web/app/(public)/members/page.tsx                      09e:208-338
apps/web/app/(public)/members/[id]/page.tsx                 09e:339-472
apps/web/app/(public)/register/page.tsx                     09e:473-560
apps/web/app/privacy/page.tsx                               09e:561-620
apps/web/app/terms/page.tsx                                 09e:621-680
apps/web/app/login/page.tsx                                 09f:30-110
apps/web/app/profile/page.tsx                               09f:111-280
apps/web/app/(admin)/admin/page.tsx                         09g:4-161
apps/web/app/(admin)/admin/members/page.tsx                 09g:162-280
apps/web/app/(admin)/admin/tags/page.tsx                    09g:281-400
apps/web/app/(admin)/admin/meetings/page.tsx                09g:401-520
apps/web/app/(admin)/admin/schema/page.tsx                  09g:521-640
apps/web/app/(admin)/admin/requests/page.tsx                09g:641-740
apps/web/app/(admin)/admin/identity-conflicts/page.tsx      09g:741-840
apps/web/app/(admin)/admin/audit/page.tsx                   09g:841-940
```

結果: G-1 ✅ all pass

## Fallback (3)

`apps/web/app/{error,not-found,loading}.tsx` に `09h:fallback` marker を確認。

## CI / 静的検証

| Gate | コマンド | 結果 |
|------|----------|------|
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| lint | `pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| G-5 | `! rg -n 'bg-\[#|text-\[#' apps/web/app apps/web/src` | 0 件 |
| G-6 | `! rg -n '127\.0\.0\.1:8888' apps/web/app apps/web/src` | 0 件 |

## 非該当 (本 SW スコープ外で実行しないもの)

- Playwright smoke (19 routes) — local 環境では server 起動が必要なため CI で確認
- Visual snapshot (4 screens) — SW-07 で baseline 固定（本 SW では取得のみ）
- `verify-design-tokens` — CI gate のみ（既存 HEX は本 SW 範囲外 file (`opengraph-image.tsx`) のみ）
