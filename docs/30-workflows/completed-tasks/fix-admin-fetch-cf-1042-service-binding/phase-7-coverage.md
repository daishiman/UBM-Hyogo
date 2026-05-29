# Phase 7: カバレッジ確認

## 対象

`apps/web/src/lib/admin/server-fetch.ts` の以下関数:

- `fetchAdmin` (transport 分岐部、header build、error throw)
- `getAdminServiceBinding`
- `isTestOrPlaywright`
- `buildAdminRequestHeaders`

## 目標

- transport 分岐の binding / HTTP fallback を Phase 4 の新規 tests が直接踏む
- `INTERNAL_API_BASE_URL` missing fail-fast は既存 env regression で担保

## 計測

```bash
mise exec -- pnpm --filter web test -- --coverage --run src/lib/admin/__tests__/server-fetch
```

本タスクでは coverage 数値 gate ではなく focused branch evidence を採用する。実測は Phase 11 に集約。

## 対象外

- `server-fetch.ts` の既存 fixture 定数群（`task18*Fixture` 等）はスコープ外。今回の変更行（transport 分岐）に限定して評価する。
