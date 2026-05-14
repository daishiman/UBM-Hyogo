[実装区分: 実装仕様書]

# Phase 8: CI workflow / Playwright config / package scripts 実装仕様

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Phase | 8 / 13 |
| 目的 | `.github/workflows/verify-design-tokens.yml` / `.github/workflows/playwright-smoke.yml` を新設し、`apps/web/playwright.config.ts` に `smoke-chromium` / `visual-chromium` projects を追加、root + `apps/web` の `package.json` に必要 scripts を加える |
| 前提 Phase | Phase 5（verify CLI）/ Phase 6（smoke spec + auth fixture）/ Phase 7（visual baseline） |
| 想定工数 | 0.2 人日 |

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. `verify-design-tokens` workflow を PR (`main` / `dev`) と push (`main` / `dev`) でトリガし、`mise exec -- pnpm verify:tokens` を実行。
2. `playwright-smoke` workflow を 2 job 構成（`smoke` + `visual`）で実装。`schedule` (`0 18 * * *`) と `workflow_dispatch` (`base_url` input) を備える。
3. `apps/web/playwright.config.ts` に `smoke-chromium` / `visual-chromium` projects を **追加** し、既存 `desktop-chromium` / `firefox` / `mobile-webkit` は温存。
4. `package.json` (root) に `verify:tokens` を追加。
5. `apps/web/package.json` に `e2e:smoke` / `e2e:visual` / `e2e:visual:update` を追加。
6. concurrency / artifact upload / 命名規則 (`verify-*` / `playwright-*`) を遵守。

### 2.2 非ゴール

- 既存 `.github/workflows/e2e-tests.yml` の責務移行（職掌分離のため別ファイルのまま）
- branch protection の `gh api -X PUT` 実行（ユーザー承認後の別ステップ）
- firefox / webkit を required にすること

## 3. 変更対象ファイル一覧

| パス | 種別 | 説明 |
|------|------|------|
| `.github/workflows/verify-design-tokens.yml` | new | token drift 検知の PR / push gate |
| `.github/workflows/playwright-smoke.yml` | new | smoke + visual の 2 job、nightly schedule、workflow_dispatch |
| `apps/web/playwright.config.ts` | edit | `smoke-chromium` / `visual-chromium` projects 追加、`baseURL` 切替、`webServer` 条件起動 |
| `package.json` (root) | edit | `scripts.verify:tokens` 追加 |
| `apps/web/package.json` | edit | `scripts.e2e:smoke` / `e2e:visual` / `e2e:visual:update` 追加 |
| `.github/workflows/e2e-tests.yml` | edit (任意) | 重複トリガ回避の調整のみ。重複しない場合は触らない |

## 4. 関数・YAML 構造シグネチャ

### 4.1 `.github/workflows/verify-design-tokens.yml`

```yaml
name: verify-design-tokens

on:
  pull_request:
    branches: [main, dev]
    paths:
      - 'apps/web/src/styles/tokens.css'
      - 'apps/web/src/styles/globals.css'
      - 'docs/00-getting-started-manual/specs/09b-design-tokens.md'
      - 'scripts/verify-design-tokens.ts'
      - '.github/workflows/verify-design-tokens.yml'
  push:
    branches: [main, dev]

concurrency:
  group: verify-design-tokens-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: verify-design-tokens
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - name: Install deps
        run: mise exec -- pnpm install --frozen-lockfile
      - name: Run verify-design-tokens
        run: mise exec -- pnpm verify:tokens
```

### 4.2 `.github/workflows/playwright-smoke.yml`

```yaml
name: playwright-smoke

on:
  pull_request:
    branches: [main, dev]
    paths:
      - 'apps/web/**'
      - '.github/workflows/playwright-smoke.yml'
  push:
    branches: [main]
  schedule:
    - cron: '0 18 * * *' # JST 03:00 nightly
  workflow_dispatch:
    inputs:
      base_url:
        description: 'External baseURL (staging / preview)'
        required: false

concurrency:
  group: playwright-smoke-${{ github.ref }}
  cancel-in-progress: true

jobs:
  smoke:
    name: smoke (chromium)
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      PLAYWRIGHT_BASE_URL: ${{ inputs.base_url || '' }}
      E2E_ADMIN_SESSION_TOKEN: ${{ secrets.E2E_ADMIN_SESSION_TOKEN }}
      E2E_MEMBER_SESSION_TOKEN: ${{ secrets.E2E_MEMBER_SESSION_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
      - name: Run smoke
        run: mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-smoke-report
          path: apps/web/playwright-report
          retention-days: 14

  visual:
    name: visual (chromium, 4 screens)
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: smoke
    if: github.event_name != 'schedule'
    env:
      E2E_ADMIN_SESSION_TOKEN: ${{ secrets.E2E_ADMIN_SESSION_TOKEN }}
      E2E_MEMBER_SESSION_TOKEN: ${{ secrets.E2E_MEMBER_SESSION_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
      - run: mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diff
          path: apps/web/test-results
          retention-days: 14
```

### 4.3 `apps/web/playwright.config.ts`（projects 追加）

```ts
import { defineConfig, devices } from '@playwright/test'

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.PLAYWRIGHT_STAGING_BASE_URL ??
  'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'playwright-report/results.json' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'smoke-chromium',
      testMatch: /full-smoke\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'visual-chromium',
      testMatch: /visual\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    // 既存 desktop-chromium / firefox / mobile-webkit はそのまま残す
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command: 'pnpm --filter @ubm-hyogo/web dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
})
```

### 4.4 npm scripts

`package.json` (root):

```jsonc
{
  "scripts": {
    "verify:tokens": "tsx scripts/verify-design-tokens.ts"
  }
}
```

`apps/web/package.json`:

```jsonc
{
  "scripts": {
    "e2e:smoke": "playwright test --project=smoke-chromium",
    "e2e:visual": "playwright test --project=visual-chromium",
    "e2e:visual:update": "playwright test --project=visual-chromium --update-snapshots"
  }
}
```

### 4.5 Required status check（参考・本 Phase では PUT しない）

```
verify-design-tokens / verify-design-tokens
playwright-smoke / smoke (chromium)
playwright-smoke / visual (chromium, 4 screens)
```

確認コマンド:

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '.required_status_checks.contexts'
```

## 5. テスト方針（Phase 8 内で動くテスト）

| 観点 | 手段 |
|------|------|
| YAML lint | `actionlint .github/workflows/verify-design-tokens.yml .github/workflows/playwright-smoke.yml` |
| schedule cron | `0 18 * * *` (UTC = JST 03:00) を README / 仕様書とも整合確認 |
| workflow_dispatch input | `base_url` が optional で `inputs.base_url` として参照可能 |
| playwright config 構文 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list --project=smoke-chromium` で project 認識 |
| script 追加 | `mise exec -- pnpm verify:tokens` / `mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke` がそれぞれ起動できる |
| 重複トリガ | `.github/workflows/e2e-tests.yml` と `playwright-smoke.yml` の `paths` / `branches` が重複しても concurrency group で cancel される |

## 6. ローカル実行・検証コマンド

```bash
# workflow lint
actionlint .github/workflows/verify-design-tokens.yml .github/workflows/playwright-smoke.yml

# project 一覧
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list --project=smoke-chromium
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list --project=visual-chromium

# scripts 起動
mise exec -- pnpm verify:tokens
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual

# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 7. DoD チェックリスト

- [ ] `.github/workflows/verify-design-tokens.yml` が PR / push (`main`,`dev`) でトリガ、concurrency group 設定済み
- [ ] `.github/workflows/playwright-smoke.yml` が PR / push (`main`) / schedule / workflow_dispatch をサポート
- [ ] `playwright-smoke` の `visual` job は `needs: smoke` かつ `if: github.event_name != 'schedule'`
- [ ] 両 workflow とも `actions/upload-artifact@v4` で report / diff を 14 日保持
- [ ] `apps/web/playwright.config.ts` に `smoke-chromium` / `visual-chromium` projects が追加され、既存 project は温存
- [ ] `webServer` は `PLAYWRIGHT_BASE_URL` 設定時に `undefined` となり、外部 baseURL でも動作
- [ ] root `package.json#scripts.verify:tokens` が `tsx scripts/verify-design-tokens.ts`
- [ ] `apps/web/package.json#scripts` に `e2e:smoke` / `e2e:visual` / `e2e:visual:update` の 3 件が追加
- [ ] `actionlint` が両 workflow に対し error 0
- [ ] Required status check 追加は別 Phase / 別 PR で行う旨が運用ドキュメントに残る（本 Phase では PUT しない）
