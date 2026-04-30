# Phase 5 Runbook — local 実行手順

> 後続実装者が **本 runbook を上から順に実行**するだけで Phase 4 verify suite を再現できる状態に到達する。所要時間目安: 初回 25 分 / 2 回目以降 5 分。

## 前提条件

- Node 24.15.0 / pnpm 10.33.2（`mise install` 済み）
- 1Password CLI (`op`) ログイン済み（`op signin`）
- Cloudflare API Token 等は `.env` の `op://` 参照経由で揮発注入

## Step 1: 依存追加

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web add -D @playwright/test@^1.50.0 @axe-core/playwright@^4.10.0
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium webkit firefox
```

## Step 2: D1 local seed

```bash
# apps/api 配下の seed SQL を local D1 へ流し込む
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local \
  --file=apps/api/test/fixtures/seed-e2e.sql

# 期待: 5 members (うち 1 deleted, 1 unregistered, 1 rules_declined)
#       2 meetings, 6 tag categories, 1 admin user
```

## Step 3: API ローカル起動 (background)

```bash
# Terminal 1
bash scripts/cf.sh dev --config apps/api/wrangler.toml --local
# url: http://localhost:8787  (healthz: /healthz)
```

## Step 4: Web ローカル起動 (background)

```bash
# Terminal 2
mise exec -- pnpm --filter @ubm-hyogo/web dev
# url: http://localhost:3000
```

## Step 5: Playwright 実行 (desktop chromium)

```bash
# Terminal 3
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=desktop-chromium

# 期待: 45 row 中 7 spec の skeleton が PASS（test.describe.skip 解除後は 70+ test）
```

## Step 6: 全 viewport / 全 browser

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test
# desktop-chromium / mobile-webkit / desktop-firefox の 3 projects を実行
```

## Step 7: HTML レポート確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright show-report \
  ../../docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-11/evidence/playwright-report

# 期待: violations 0 / screenshot 30 枚以上 / failure 0
```

## Sanity Check

| 項目 | 期待値 |
| --- | --- |
| `playwright test` exit code | 0 |
| screenshot 枚数 (`outputs/phase-11/evidence/desktop/`) | 19 枚以上 |
| screenshot 枚数 (`outputs/phase-11/evidence/mobile/`) | 11 枚以上 |
| axe critical/serious 違反 | 0 件 |
| `/no-access` HTTP status | 404 |

## トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| `wrangler dev` が `D1 not found` で起動失敗 | `bash scripts/cf.sh d1 list` で local DB を確認後 Step 2 を再実行 |
| `webServer` timeout 60s 超過 | `playwright.config.ts` の `webServer.timeout` を 120_000 に一時引き上げ |
| Auth.js cookie sign error | `signSession()` 実装と `AUTH_SECRET` の `.env` 参照を確認 |
| `playwright install` が CI でキャッシュミス | `~/.cache/ms-playwright` を `actions/cache` 対象へ追加 |
