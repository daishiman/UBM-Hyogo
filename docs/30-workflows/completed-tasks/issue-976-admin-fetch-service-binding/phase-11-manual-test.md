# Phase 11 — マニュアルテスト / Evidence

## 状態

`implemented_local_runtime_pending` — local focused tests は PASS。staging deploy + authenticated screenshot は user-gated。

## Local Evidence

| # | 内容 | 結果 |
|---|------|------|
| 1 | `pnpm exec vitest run apps/web/src/lib/admin/__tests__/server-fetch-service-binding.spec.ts apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts` | PASS: 3 files / 9 tests |
| 2 | `apps/web/src/lib/admin/server-fetch.ts` transport inspection | `API_SERVICE.fetch()` 優先、test/Playwright fallback 維持 |

## 取得予定 Evidence

| # | 内容 | 配置先 |
|---|------|--------|
| 1 | `/admin/meetings` (staging, authenticated, 200) screenshot | `outputs/phase-11/admin-meetings-200.png` |
| 2 | `wrangler tail` 抜粋(ADMIN_FETCH_404 非発火) | `outputs/phase-11/wrangler-tail.txt` |
| 3 | `/admin/members` `/admin/requests` `/admin/identity-conflicts` `/admin/audit` の正常表示 screenshot | `outputs/phase-11/admin-{route}-200.png` |
| 4 | network panel: `admin/meetings` response status 200 | `outputs/phase-11/admin-meetings-network.png` |

## 取得手順

1. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
2. authenticated browser session で各 route にアクセスし screenshot 取得
3. 並行して `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` を起動し、ADMIN_FETCH_* event の有無を記録
