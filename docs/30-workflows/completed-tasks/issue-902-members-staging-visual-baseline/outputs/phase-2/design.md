# Phase 2 — Design

## 1. アーキテクチャ

`staging-visual` project は `apps/web/playwright.config.ts` L236-250 で確立済み:

- `testDir: './playwright/tests/visual-staging'`
- `testMatch: /visual-staging\/.*\.spec\.ts$/`
- `baseURL: stagingBaseURL`（`PLAYWRIGHT_STAGING_BASE_URL` 環境変数）
- `retries: 2`、`viewport: 1280x800`

本仕様は spec ファイル 2 件を `playwright/tests/visual-staging/` 配下に追加するのみで自動マッチさせる。`playwright.config.ts` 変更は不要。

## 2. spec ファイル設計

### 2.1 `members-list.spec.ts`

```ts
import { expect, test } from '@playwright/test'

test('staging members list (initial view) baseline', async ({ page }) => {
  await page.route('**/api/**', (route) => route.continue())
  await page.goto('/members')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('members-list.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
  })
})
```

設計判断:

- query を一切付けずに `/members` のみへ goto → filter / sort / pagination の変動を排除
- SSR データは staging 実値（空状態含む）を許容
- `page.route('**/api/**', continue)` で client-side fetch 経路のみ Playwright 監視下に置く

### 2.2 `member-detail.spec.ts`

```ts
import { expect, test } from '@playwright/test'

const memberId = process.env.PLAYWRIGHT_MEMBER_DETAIL_ID

test('staging member detail baseline', async ({ page }) => {
  test.skip(!memberId, 'PLAYWRIGHT_MEMBER_DETAIL_ID is not set; skipping member-detail baseline')

  await page.route('**/api/**', (route) => route.continue())
  await page.goto(`/members/${memberId}`)
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('member-detail.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
  })
})
```

設計判断:

- 環境変数 `PLAYWRIGHT_MEMBER_DETAIL_ID` が未設定の場合は `test.skip` で安全停止 → seed 未整備環境での noise を排除
- ID をハードコードしない（seed 移行耐性確保）

## 3. workflow 変更

### 3.1 `.github/workflows/playwright-smoke.yml`

| 箇所 | 変更前 | 変更後 |
|------|--------|--------|
| L100 `name:` | `staging-visual (chromium, 4 screens)` | `staging-visual (chromium, 6 screens)` |
| L116 step `name:` | `Run staging visual (4 screens)` | `Run staging visual (6 screens)` |

L124 の `path: apps/web/playwright/tests/visual-staging/**/*-staging-visual-chromium-linux.png` は glob のため変更不要。

## 4. データフロー

```
PLAYWRIGHT_STAGING_BASE_URL → staging-visual project baseURL
  └─ /members        → SSR (Workers fetch staging API) → page.route 監視 → screenshot
  └─ /members/<ID>   → SSR (fetchPublicOrNotFound) → page.route 監視 → screenshot
                       (ID は PLAYWRIGHT_MEMBER_DETAIL_ID)
```

## 5. リスクと緩和

| Risk | 緩和 |
|------|------|
| seed 変更で member-detail が 404 化 | `test.skip` フォールバック + `PLAYWRIGHT_MEMBER_DETAIL_ID` 注入による外部化 |
| members-list が空状態 baseline 化 | staging seed に member 投入が前提（user-gated）/ 空状態の design system 検証として許容 |
| OS 差で local pass / CI fail | `-darwin.png` をコミットしない gate（既存運用継承） |
| filter / sort で flake | query 無し初期表示のみで固定 |
