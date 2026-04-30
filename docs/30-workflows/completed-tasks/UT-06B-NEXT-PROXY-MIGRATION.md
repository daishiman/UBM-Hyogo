# UT-06B-NEXT-PROXY-MIGRATION

## Summary

Next.js 16 の warning に従い、06b/05a の `apps/web/middleware.ts` route gate を `proxy` convention へ移行する。

## Why

2026-04-29 の Phase 11 evidence 取得時、Next.js dev server が `"middleware" file convention is deprecated. Please use "proxy" instead.` を出した。現状は typecheck / runtime smoke は通るが、将来バージョンで route gate の保守負荷が上がる。

## Acceptance Criteria

- `/admin/:path*` と `/profile/:path*` の gate behavior が proxy convention に移行されている
- 未ログイン `/profile` が `/login?redirect=%2Fprofile` へ redirect する
- admin gate の `gate=admin_required` 挙動が維持される
- 既存 middleware/proxy 関連テストまたは smoke evidence が更新されている

## Priority

Medium.
