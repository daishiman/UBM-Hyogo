# Phase 9 — QA

## ローカル QA コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter=@ubm-hyogo/web exec vitest run src/lib/admin/__tests__/
mise exec -- pnpm test
bash scripts/verify-pr-ready.sh
```

## 期待結果

- typecheck / lint green
- vitest 全 pass(新規 6 ケース含む)
- verify-pr-ready green

## 観察ポイント

- 既存 `safe-server-fetch-404-vs-401.spec.ts` `server-fetch-url.spec.ts` が pass
- 既存 admin route の Playwright fixture 経路に影響がない(fetchAdmin 冒頭の env-gated 早期 return 群が service-binding 切替より上流)

## staging runtime QA (user-gated)

1. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
2. authenticated browser session で `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/meetings` にアクセス
3. HTTP 200 で開催日リストが描画されることを確認
4. `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` で ADMIN_FETCH_404 が発火しないこと
5. 他 admin route (`/admin/members` `/admin/requests` `/admin/identity-conflicts` `/admin/audit`) も同様に正常表示することを確認(波及修復)
