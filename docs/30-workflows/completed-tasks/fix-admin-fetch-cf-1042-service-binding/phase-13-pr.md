# Phase 13: PR 作成

## 前提

user の明示承認後のみ実行。

## ブランチ

`feat/fix-admin-fetch-cf-1042-service-binding`（既に作成済み、dev からの merge も済）

## PR タイトル候補

`fix(admin): fetchAdmin を Service Binding 経由に切替えて CF error 1042 を解消`

## PR base

`dev`

## body 骨子

```
## Summary
- staging /admin で発生していた `admin api /admin/dashboard failed: 404 body=error code: 1042` を解消
- `apps/web/src/lib/admin/server-fetch.ts` `fetchAdmin` を service-binding 優先 / HTTP fallback の transport selector pattern に移行（既に同じ pattern を持つ `fetchPublic` と auth に揃える）
- API_SERVICE binding は wrangler.toml に staging/production 共配置済みで、application code 側だけが未追従だったことが根本原因

## Root cause
Cloudflare Workers が同一 account の別 Worker (`*.workers.dev`) を raw HTTP fetch すると loopback が拒否され HTTP 404 + body `error code: 1042` を返す。`fetchPublic` 側では既に解決済みだった transport policy を `fetchAdmin` にも適用。

## Test plan
- [ ] `pnpm --filter web test -- --run src/lib/admin/__tests__/server-fetch`（unit 12 ケース green）
- [ ] `pnpm typecheck` / `pnpm lint`
- [ ] staging deploy 後 `/admin` で error banner が消えること
- [ ] tail で `{ transport: "service-binding", scope: "admin", path: "/admin/dashboard", status: 200 }` を観測
- [ ] `/admin/members` `/admin/meetings` `/admin/schema` も 200 で render されること（副次解消）
```

## merge 後

PR merge 後、ユーザー承認に基づいて `docs/30-workflows/completed-tasks/fix-admin-fetch-cf-1042-service-binding/` → `docs/30-workflows/completed-tasks/` へ mv し、artifacts.json / outputs/artifacts.json の `hasCompletedTasksAncestor=true` 化を行う。
