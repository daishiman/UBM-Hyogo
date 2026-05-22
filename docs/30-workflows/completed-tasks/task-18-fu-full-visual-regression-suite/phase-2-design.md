[実装区分: 実装仕様書]

# Phase 2: 設計

## 目的

Phase 1 要件を実装する具体設計を確定する。playwright.config / spec / workflow / fixture の構造、関数シグネチャ、yaml 構造をすべて明示する。

---

## 入力

- `outputs/phase-1/requirements.md`
- 現行 `apps/web/playwright.config.ts`（line 142-145 `visual-chromium` project）
- `.github/workflows/playwright-smoke.yml` (line 52- visual job)

---

## 1. playwright.config.ts diff 方針

`apps/web/playwright.config.ts` の `projects: []` 配列末尾に以下 3 entry を追加。既存 `visual-chromium` は touch しない。

```ts
// 既存 import に追加
import { VIEWPORTS } from './playwright/fixtures/viewports'

// projects 配列末尾に追加
{
  name: 'visual-full-chromium-desktop',
  testDir: './playwright/tests/visual-full',
  use: {
    ...devices['Desktop Chrome'],
    viewport: VIEWPORTS.desktop,
  },
},
{
  name: 'visual-full-chromium-tablet',
  testDir: './playwright/tests/visual-full',
  use: {
    ...devices['Desktop Chrome'],
    viewport: VIEWPORTS.tablet,
  },
},
{
  name: 'visual-full-chromium-mobile',
  testDir: './playwright/tests/visual-full',
  use: {
    ...devices['Desktop Chrome'],
    viewport: VIEWPORTS.mobile,
  },
},
```

`expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } }` は既に root に存在するため変更不要（W7 から継承）。

---

## 2. fixture: viewports.ts

`apps/web/playwright/fixtures/viewports.ts`（新規）:

```ts
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const

export type ViewportName = keyof typeof VIEWPORTS
```

---

## 3. fixture: visual-routes.ts

`apps/web/playwright/fixtures/visual-routes.ts`（新規）:

```ts
export type AuthRole = 'none' | 'member' | 'admin'

export interface VisualRoute {
  /** スナップショット slug（ファイル名生成用） */
  slug: string
  /** Playwright page.goto に渡す path（先頭 / 付き） */
  path: string
  /** 認証要否 */
  auth: AuthRole
  /** 表示完了を待つ data-testid（無ければ body） */
  waitFor?: string
}

export const VISUAL_ROUTES: readonly VisualRoute[] = [
  { slug: 'root',                    path: '/',                              auth: 'none' },
  { slug: 'members',                 path: '/members',                       auth: 'none' },
  { slug: 'members-detail',          path: '/members/sample-001',            auth: 'none' },
  { slug: 'register',                path: '/register',                      auth: 'none' },
  { slug: 'privacy',                 path: '/privacy',                       auth: 'none' },
  { slug: 'terms',                   path: '/terms',                         auth: 'none' },
  { slug: 'login',                   path: '/login',                         auth: 'none' },
  { slug: 'profile',                 path: '/profile',                       auth: 'member' },
  { slug: 'admin',                   path: '/admin',                         auth: 'admin' },
  { slug: 'admin-members',           path: '/admin/members',                 auth: 'admin' },
  { slug: 'admin-tags',              path: '/admin/tags',                    auth: 'admin' },
  { slug: 'admin-meetings',          path: '/admin/meetings',                auth: 'admin' },
  { slug: 'admin-schema',            path: '/admin/schema',                  auth: 'admin' },
  { slug: 'admin-requests',          path: '/admin/requests',                auth: 'admin' },
  { slug: 'admin-identity-conflicts',path: '/admin/identity-conflicts',      auth: 'admin' },
  { slug: 'admin-audit',             path: '/admin/audit',                   auth: 'admin' },
  { slug: 'not-found',               path: '/__not_found_canary',            auth: 'none' },
]

// 17 件であることをコンパイル時に確認
const _ASSERT_17: 17 = VISUAL_ROUTES.length as 17
```

---

## 4. spec: full-visual.spec.ts

`apps/web/playwright/tests/visual-full/full-visual.spec.ts`（新規）:

```ts
import { adminLogin, expect, memberLogin, test } from '../../fixtures/auth'
import { VISUAL_ROUTES } from '../../fixtures/visual-routes'

for (const route of VISUAL_ROUTES) {
  test.describe(`visual: ${route.slug}`, () => {
    test(`${route.slug}`, async ({ page, context, mockApi }, testInfo) => {
      void mockApi
      if (route.auth === 'admin') await adminLogin(context)
      if (route.auth === 'member') await memberLogin(context)
      await page.goto(route.path)
      expect(new URL(page.url()).pathname).toBe(route.path.split('?')[0])
      await page.waitForLoadState('networkidle')
      // フォント / アニメーション安定化
      await page.evaluate(() => document.fonts?.ready)
      await page.addStyleTag({
        content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;}',
      })

      const viewport = testInfo.project.name.replace('visual-full-chromium-', '')
      await expect(page).toHaveScreenshot(`full-visual-${route.slug}-${viewport}.png`, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
        scale: 'css',
        mask: [
          page.locator('[data-visual-mask]'),
          page.locator('time'),
        ],
      })
    })
  })
}
```

- 認証は W7 既存の `playwright/fixtures/auth.ts` にある `adminLogin(context)` / `memberLogin(context)` を再利用する。現行リポジトリに `setup-auth-*` project は存在しないため、新規 `storageState` 生成 project は追加しない。

---

## 5. workflow: playwright-visual-full.yml

`.github/workflows/playwright-visual-full.yml`（新規）構造:

```yaml
name: playwright-visual-full

on:
  schedule:
    - cron: '0 18 * * *'   # JST 03:00 nightly
  pull_request:
    paths:
      - 'apps/web/src/**'
      - 'apps/web/playwright.config.ts'
      - 'apps/web/playwright/tests/visual-full/**'
      - 'apps/web/playwright/fixtures/**'
      - 'apps/web/src/styles/tokens.css'
      - '.github/workflows/playwright-visual-full.yml'

concurrency:
  group: visual-full-${{ github.ref }}
  cancel-in-progress: true

jobs:
  visual-full:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        viewport: [desktop, tablet, mobile]
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
      - name: Install playwright browsers
        run: pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
      - name: Build apps/web
        run: pnpm --filter @ubm-hyogo/web build
      - name: Run visual-full
        run: pnpm --filter @ubm-hyogo/web exec playwright test --project=visual-full-chromium-${{ matrix.viewport }}
      - name: Upload diff artifact on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-full-${{ matrix.viewport }}-diff
          path: apps/web/test-results/
          retention-days: 14
```

---

## 6. workflow: playwright-visual-baseline-update.yml

`.github/workflows/playwright-visual-baseline-update.yml`（新規）構造:

```yaml
name: playwright-visual-baseline-update

on:
  workflow_dispatch:
    inputs:
      reason:
        description: 'なぜ baseline 更新が必要か（必須）'
        required: true
        type: string

jobs:
  update-baseline:
    runs-on: ubuntu-latest
    environment: visual-baseline-approval   # ← user approval gate
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.ref }}
      - uses: ./.github/actions/setup-project
      - name: Install playwright browsers
        run: pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
      - name: Build apps/web
        run: pnpm --filter @ubm-hyogo/web build
      - name: Regenerate baselines
        run: |
          pnpm --filter @ubm-hyogo/web exec playwright test \
            --project=visual-full-chromium-desktop \
            --project=visual-full-chromium-tablet \
            --project=visual-full-chromium-mobile \
            --update-snapshots
      - name: Open PR with baseline diff
        uses: peter-evans/create-pull-request@v7
        with:
          branch: chore/visual-baseline-update-${{ github.run_id }}
          base: dev
          title: 'chore(visual): update baselines'
          body: |
            ## Reason
            ${{ inputs.reason }}

            workflow_dispatch run: ${{ github.run_id }}
          commit-message: 'chore(visual): update baselines via workflow_dispatch'
          add-paths: apps/web/playwright/tests/visual-full/**
```

`environment: visual-baseline-approval` は GitHub repo settings → Environments で **required reviewers** を 1 名（owner）に設定することで approval gate を有効化する。設定手順は Phase 5 / Phase 13 で言及。

---

## 7. package.json scripts 追加

`apps/web/package.json` の `scripts` セクションに以下を追加:

```json
{
  "test:visual-full": "playwright test --project=visual-full-chromium-desktop --project=visual-full-chromium-tablet --project=visual-full-chromium-mobile",
  "test:visual-full:update": "playwright test --project=visual-full-chromium-desktop --project=visual-full-chromium-tablet --project=visual-full-chromium-mobile --update-snapshots"
}
```

---

## 8. 関数/設定シグネチャ一覧

| シンボル | 場所 | シグネチャ |
|----------|------|-----------|
| `VIEWPORTS` | `playwright/fixtures/viewports.ts` | `{ desktop, tablet, mobile: { width, height } }` const |
| `ViewportName` | 同上 | `keyof typeof VIEWPORTS` |
| `VisualRoute` | `playwright/fixtures/visual-routes.ts` | `{ slug, path, auth, waitFor? }` interface |
| `VISUAL_ROUTES` | 同上 | `readonly VisualRoute[]`、length=17 |
| spec 内 test name | spec | `visual: ${slug}` describe / `${slug}` test |
| baseline filename | playwright auto | `full-visual-${slug}-${viewport}-visual-full-chromium-{os}.png` |

---

## 9. 成果物

- `outputs/phase-2/design.md`（本ファイルの確定版）
