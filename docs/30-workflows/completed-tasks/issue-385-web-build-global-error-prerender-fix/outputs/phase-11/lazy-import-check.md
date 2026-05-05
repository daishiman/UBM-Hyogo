[実装区分: 実装仕様書]

# Lazy Import Check

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| checked_at | 2026-05-03 |
| evidence | LOCAL_STRUCTURAL_CHECK |
| 採用方針 | Plan A — `getAuth()` lazy factory |

## 結果

PASS。

- `apps/web/src/lib/auth.ts` は `next-auth` / provider / jwt を静的 import しない。`import type` / `typeof import(...)` も使わず、runtime `await import(...)` のみに限定。
- `apps/web/src/lib/auth/oauth-client.ts` は `next-auth/react` を top-level import せず、`signInWithGoogle()` 内の dynamic import に限定。
- auth / admin / me route handler と `src/lib/session.ts` は `await getAuth()` 経由で `handlers` / `auth` / `signIn` を取得する。
- `next` / `react` / `react-dom` / `next-auth` の version bump、`next.config.ts`、middleware変更は不要。`apps/web/package.json` は build script の `NODE_ENV=production` 明示のみ変更。

## 構造検査コマンド

```bash
rg -n '^import.*from "next-auth|typeof import\("next-auth"' apps/web/src/lib/auth.ts
rg -n '^import.*from "next-auth/react' apps/web/src/lib/auth/oauth-client.ts
rg -n 'await getAuth\(\)' \
  apps/web/app/api/auth/[...nextauth]/route.ts \
  apps/web/app/api/auth/callback/email/route.ts \
  apps/web/app/api/admin/[...path]/route.ts \
  apps/web/app/api/me/[...path]/route.ts \
  apps/web/src/lib/session.ts
```

## 期待値

- 1 本目: 0 hit
- 2 本目: 0 hit
- 3 本目: 5 hit 以上

## 4 条件

| 条件 | 判定 |
| --- | --- |
| 矛盾なし | PASS: 旧 `global-error.tsx` RSC 化案を採用しない |
| 漏れなし | PASS: `auth.ts` / `oauth-client.ts` / auth route / callback route / admin route / me route / session helper を lazy 経路へ統一 |
| 整合性あり | PASS: type-only import と dynamic import の境界を明示 |
| 依存関係整合 | PASS: local implementation と deploy / PR approval gate を分離 |
