# task-08b-staging-url-playwright-execution-001

## 概要

Playwright を staging URL に向けて実走可能にする。`PLAYWRIGHT_BASE_URL` の環境変数差し替えだけでは Auth.js cookie 注入と D1 seed/reset 戦略が成立しないため、staging 環境固有の認証注入と seed 戦略を再設計する。

## 苦戦箇所【記入必須】

- 対象: `apps/web/playwright/global-setup.ts`, `apps/web/playwright/fixtures/auth.ts`, `.github/workflows/e2e-tests.yml`
- 症状: 08b は local 完結 (`http://localhost:3000`) 前提で fixture を組んでいる。staging URL に向けると (1) ローカル Auth.js secret で sign した JWT cookie が staging で reject される (2) D1 seed をテスト走行ごとに reset すると staging データを破壊する、という 2 大障害が発生
- 参照: `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-12/unassigned-task-detection.md` の U-5

## スコープ（含む/含まない）

含む:

- staging 用 Auth.js cookie 注入手順（OAuth login UI 経由 or staging secret で signed JWT 注入）
- staging 専用 seed namespace の設計（`e2e_test_*` プレフィクス + 走行後 cleanup）
- staging URL 実走の CI ジョブ追加（nightly schedule）
- CDN cache / Workers runtime 差分の観測項目（`cf-cache-status` ヘッダ assertion）

含まない:

- production URL を対象とした E2E（禁止）
- staging 環境構築そのもの（09a staging-deploy-smoke のスコープ）
- 本番データに対する seed / reset 操作

## リスクと対策

| リスク | 対策 |
| --- | --- |
| staging D1 への seed reset で他作業者のデータ破壊 | テストデータは `e2e_test_*` プレフィクスに限定、cleanup は LIKE 条件 + safety check |
| Auth.js secret の漏洩 | staging secret は GitHub Secrets + 1Password 管理、CI ログに echo しない |
| CDN cache hit で旧版 bundle がテストされる | Playwright fixture で `?cache_bust=$(timestamp)` クエリ付与または `Cache-Control: no-cache` 強制 |
| Cloudflare Workers cold start の timing flaky | 各 spec の `beforeAll` で warm-up GET を発行 |

## 検証方法

```bash
# staging URL 実走
PLAYWRIGHT_BASE_URL=https://staging.ubm-hyogo.example \
  mise exec -- pnpm --filter @ubm-hyogo/web test:e2e --project=chromium

# Auth fixture が staging で valid か
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test fixtures/auth.spec.ts

# seed prefix の遵守確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --command "SELECT COUNT(*) FROM members WHERE email NOT LIKE 'e2e_test_%';" --env staging
```

期待: staging URL で全 spec PASS、cleanup 後に `e2e_test_*` 行が 0 件。

## 参照

- `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-12/unassigned-task-detection.md` (U-5)
- 09a staging-deploy-smoke の Phase 5 runbook
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`
- `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md`
