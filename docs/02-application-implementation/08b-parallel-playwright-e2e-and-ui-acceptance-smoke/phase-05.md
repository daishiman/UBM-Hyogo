# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

Phase 4 の verify suite を後続実装者が手順通りに進めれば作れるよう、runbook + playwright.config.ts placeholder + page object 配置 + sanity check を残す。

## 実行タスク

- [ ] runbook を 7 ステップで記述 (`outputs/phase-05/runbook.md`)
- [ ] playwright.config.ts placeholder
- [ ] page-objects 配置 (`outputs/phase-05/page-objects.md`)
- [ ] CI workflow yml placeholder
- [ ] sanity check（local 実行 + screenshot 確認）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | layout |
| 必須 | outputs/phase-04/main.md | spec signature |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler / CI |

## runbook（7 ステップ）

### Step 1: 依存追加

```bash
pnpm --filter @ubm/web add -D @playwright/test @axe-core/playwright
pnpm --filter @ubm/web exec playwright install --with-deps chromium webkit
```

### Step 2: playwright.config.ts 作成

```ts
// apps/web/playwright.config.ts (placeholder)
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: '../../outputs/phase-11/evidence/playwright-report',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { outputFolder: '../../outputs/phase-11/evidence/playwright-report' }], ['json', { outputFile: '../../outputs/phase-11/evidence/playwright-report/report.json' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile-webkit',    use: { ...devices['iPhone 13'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter @ubm/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @ubm/api dev',
      url: 'http://localhost:8787/healthz',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
```

### Step 3: fixtures / helpers 整備

```ts
// apps/web/tests/fixtures/auth.ts (placeholder)
import { test as base, expect } from '@playwright/test'
import { signSession } from './session'
type Roles = { adminPage: any; memberPage: any }
export const test = base.extend<Roles>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: undefined })
    await ctx.addCookies([{
      name: '__Secure-authjs.session-token',
      value: signSession({ adminUserId: 'admin-1' }),
      url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    }])
    const page = await ctx.newPage()
    await use(page)
  },
  memberPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: undefined })
    await ctx.addCookies([{
      name: '__Secure-authjs.session-token',
      value: signSession({ memberId: 'm-1' }),
      url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    }])
    const page = await ctx.newPage()
    await use(page)
  },
})
export { expect }
```

```ts
// apps/web/tests/helpers/screenshot.ts (placeholder)
import type { Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export async function snap(page: Page, name: string) {
  const filePath = join('outputs/phase-11/evidence', `${name}.png`)
  await mkdir(dirname(filePath), { recursive: true })
  await page.screenshot({ path: filePath, fullPage: true })
}
```

```ts
// apps/web/tests/helpers/axe.ts (placeholder)
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

export async function runAxe(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  return result.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
}
```

### Step 4: D1 seed 整備

```bash
# apps/api/scripts/seed-e2e.sh
wrangler d1 execute ubm-d1-local --local --file=./test/fixtures/seed.sql
# - 5 members (1 deleted, 1 unregistered, 1 rules_declined)
# - 2 meetings (1 with attendance candidates including 1 deleted)
# - 6 tag categories
# - admin user
```

### Step 5: page object 量産

- `apps/web/tests/page-objects/PublicPage.ts` (landing/members/detail/register)
- `apps/web/tests/page-objects/LoginPage.ts` (gotoState(state) で URL hash で 5 状態切替)
- `apps/web/tests/page-objects/ProfilePage.ts` (assertNoEditFormVisible / clickEditResponseUrl)
- `apps/web/tests/page-objects/AdminPage.ts` (5 admin pages の共通 nav)
- `apps/web/tests/page-objects/AttendancePage.ts` (registerAttendance / observeToast)

### Step 6: spec 量産

- Phase 4 の signature をベースに 7 spec を順に実装
- 必ず screenshot を `outputs/phase-11/evidence/{viewport}/` に保存
- a11y は public / login / profile / admin spec で `runAxe(page)` を呼び expect 0

### Step 7: CI workflow yml

```yaml
# .github/workflows/e2e-tests.yml (placeholder)
name: e2e-tests
on:
  pull_request:
    paths: ['apps/web/**', 'apps/api/**']
  push:
    branches: [dev, main]
jobs:
  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @ubm/web exec playwright install --with-deps chromium webkit
      - run: pnpm --filter @ubm/api dev &
        env: { CI: 'true' }
      - run: pnpm --filter @ubm/web build
      - run: pnpm --filter @ubm/web exec playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-evidence
          path: outputs/phase-11/evidence/
```

## sanity check

```bash
# local
pnpm --filter @ubm/api dev &
pnpm --filter @ubm/web dev &
pnpm --filter @ubm/web exec playwright test --project=desktop-chromium

# expected:
# - 70+ tests pass
# - outputs/phase-11/evidence/desktop/ に PNG 19 枚以上
# - axe 違反 0
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook 各 step の failure を異常系へ |
| Phase 7 | AC × runbook step マッピング |
| 下流 09a / 09b | CI workflow を release 流れへ |

## 多角的チェック観点

- 不変条件 **#4**: ProfilePage に `assertNoEditFormVisible` を実装 + spec で呼び出し
- 不変条件 **#8**: profile.spec.ts に reload 後 state 維持 test
- 不変条件 **#9**: login.spec.ts に `/no-access` 404 test
- 不変条件 **#15**: attendance.spec.ts に duplicate toast + 削除済み除外 test
- a11y: helpers/axe.ts が wcag2aa + wcag21aa を必ず enable
- 無料枠: CI 10 min 以内、chromium + webkit 並列実行

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 7 step | 5 | pending | runbook.md |
| 2 | playwright.config placeholder | 5 | pending | webServer + projects |
| 3 | fixtures / helpers placeholder | 5 | pending | auth / axe / screenshot |
| 4 | page-objects.md | 5 | pending | 5 class |
| 5 | CI workflow yml placeholder | 5 | pending | e2e-tests.yml |
| 6 | sanity check | 5 | pending | local 実行 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook 本文 |
| ドキュメント | outputs/phase-05/runbook.md | 7 step |
| placeholder | outputs/phase-05/playwright-config.ts.placeholder | playwright.config |
| ドキュメント | outputs/phase-05/page-objects.md | 5 class signature |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] runbook 7 step
- [ ] playwright.config / fixtures / CI yml placeholder
- [ ] 5 page object signature 集約

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 5 を completed

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ: runbook step ごとの failure
- ブロック条件: runbook 未完なら Phase 6 不可
