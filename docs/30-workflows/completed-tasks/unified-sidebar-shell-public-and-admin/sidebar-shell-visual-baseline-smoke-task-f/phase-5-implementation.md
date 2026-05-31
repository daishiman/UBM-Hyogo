---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 5
phase_name: 実装
created_at: 2026-05-29
---

# Phase 5: 実装

[実装区分: 実装仕様書]

## 1. 変更ファイル一覧

| # | ファイル | 種別 | 概要 |
|---|---------|------|------|
| 1 | `apps/web/playwright/tests/sidebar-shell/_helpers.ts` | 新規 | 共通操作 `waitShellReady` / `freezeAnimations` / `openDrawer` / `toggleCollapse` |
| 2 | `apps/web/playwright/tests/sidebar-shell/sidebar-shell-smoke.spec.ts` | 新規 | S1〜S6（6 smoke ケース） |
| 3 | `apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts` | 新規 | V1〜V7（7 screenshot baseline） |
| 4 | `apps/web/playwright.config.ts` | 更新 | `sidebar-shell-visual-{desktop,tablet,mobile}` 3 project + `sidebar-shell-smoke` project 追加。既存 `desktop-chromium` / `visual-chromium` の `testIgnore` に visual spec 追加 |
| 5 | `.github/workflows/playwright-smoke.yml` | 更新 | `smoke (chromium)` job に `sidebar-shell-smoke` step 追加 + `visual (sidebar-shell)` 新 matrix（3 viewport） |

着手前検証（phase-1 §7 path topology gate を再実行し 0 件 / 実在を確認）:

```bash
test ! -e apps/web/tests/e2e/_helpers/sidebar.ts && echo "OK: legacy helper path absent"
test -f apps/web/playwright/fixtures/auth.ts && echo "OK: canonical auth fixture present"
git grep -n "anonymousPage\|memberPage\|adminPage" -- apps/web/playwright/fixtures/auth.ts | head
```

---

## 2. `_helpers.ts` シグネチャ

```ts
// apps/web/playwright/tests/sidebar-shell/_helpers.ts
import type { Page } from '@playwright/test'

// shell の主要 landmark（app-shell root）が visible になるまで待つ
export async function waitShellReady(page: Page): Promise<void> {
  await page.locator('[data-testid="app-shell"]').waitFor({ state: 'visible' })
}

// animation / transition / caret を抑止して visual を安定化する
export async function freezeAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  })
}

// mobile drawer を hamburger 押下で開き、overlay が visible になるまで待つ
export async function openDrawer(page: Page): Promise<void> {
  await page.locator('[data-testid="shell-drawer-toggle"]').click()
  await page.locator('[data-testid="shell-drawer"]').waitFor({ state: 'visible' })
}

// collapse toggle を押して sidebar を collapsed 状態にする
export async function toggleCollapse(page: Page): Promise<void> {
  await page.locator('[data-testid="shell-collapse-toggle"]').click()
}
```

| 関数 | 入力 | 出力 | 副作用 |
|------|------|------|--------|
| `waitShellReady` | `page` | `Promise<void>` | なし（locator 待機のみ） |
| `freezeAnimations` | `page` | `Promise<void>` | page に `<style>` を 1 つ注入 |
| `openDrawer` | `page` | `Promise<void>` | hamburger を click（client-side state 変更。mutation API は呼ばない） |
| `toggleCollapse` | `page` | `Promise<void>` | collapse toggle を click（localStorage を更新。mutation API は呼ばない） |

### selector 表（想定 `data-testid`）

| 操作対象 | selector |
|----------|----------|
| shell root | `[data-testid="app-shell"]` |
| sidebar nav | `[data-testid="shell-sidebar"]` |
| hamburger | `[data-testid="shell-drawer-toggle"]` |
| drawer overlay | `[data-testid="shell-drawer"]` |
| collapse toggle | `[data-testid="shell-collapse-toggle"]` |
| user menu（左下） | `[data-testid="shell-user-menu"]` |

> これらの `data-testid` は親 Task A〜E が付与する想定。Phase 5 着手時に親実装の実 attribute を確認し、
> 未付与なら親 spec へ同一 wave で attribute 追加を申し送る（Phase 3 R7）。Task F 側で selector 契約を勝手に増やさない。

---

## 3. smoke spec シグネチャ（S1〜S6）

auth fixture の `test` を import し、destructure で fixture page を受け取る。

```ts
// apps/web/playwright/tests/sidebar-shell/sidebar-shell-smoke.spec.ts
import { expect, test } from '../../fixtures/auth'
import { openDrawer, toggleCollapse, waitShellReady } from './_helpers'

// S1: viewer / desktop — PUBLIC group only + ログイン link
test('viewer sees public-only sidebar at /', async ({ anonymousPage }) => {
  await anonymousPage.goto('/')
  await waitShellReady(anonymousPage)
  const sidebar = anonymousPage.locator('[data-testid="shell-sidebar"]')
  await expect(sidebar.getByRole('link', { name: 'ログイン' })).toBeVisible()
  await expect(sidebar.getByText('MEMBERS')).toHaveCount(0)
  await expect(sidebar.getByText('ADMIN')).toHaveCount(0)
})

// S2: member / desktop — PUBLIC + MEMBERS + 3 user actions
test('member sees public+members sidebar and 3 user actions at /profile', async ({
  memberPage,
}) => {
  await memberPage.goto('/profile')
  await waitShellReady(memberPage)
  await memberPage.locator('[data-testid="shell-user-menu"]').click()
  const menu = memberPage.locator('[data-testid="shell-user-menu"]')
  await expect(menu.getByText('プロフィール')).toBeVisible()
  await expect(menu.getByText('編集申請')).toBeVisible()
  await expect(menu.getByText('ログアウト')).toBeVisible()
})

// S3: admin / desktop — 13 nav items + 4 user actions
test('admin sees 13 nav items and 4 user actions at /admin', async ({ adminPage }) => {
  await adminPage.goto('/admin')
  await waitShellReady(adminPage)
  const navItems = adminPage.locator('[data-testid="shell-sidebar"] a')
  await expect(navItems).toHaveCount(13)
  await adminPage.locator('[data-testid="shell-user-menu"]').click()
  await expect(
    adminPage.locator('[data-testid="shell-user-menu"]').getByText('管理者ダッシュボード'),
  ).toBeVisible()
})

// S4: viewer / mobile 375 — sidebar hidden, drawer opens on hamburger
test('mobile hides sidebar and opens drawer on hamburger', async ({ anonymousPage }) => {
  await anonymousPage.setViewportSize({ width: 375, height: 812 })
  await anonymousPage.goto('/')
  await waitShellReady(anonymousPage)
  await expect(anonymousPage.locator('[data-testid="shell-sidebar"]')).not.toBeVisible()
  await openDrawer(anonymousPage)
  await expect(anonymousPage.locator('[data-testid="shell-drawer"]')).toBeVisible()
})

// S5: viewer / 1024 — collapse toggle + localStorage reflection
test('collapse toggle collapses sidebar and persists to localStorage', async ({
  anonymousPage,
}) => {
  await anonymousPage.setViewportSize({ width: 1024, height: 800 })
  await anonymousPage.goto('/')
  await waitShellReady(anonymousPage)
  await toggleCollapse(anonymousPage)
  await expect(anonymousPage.locator('[data-testid="shell-sidebar"]')).toHaveAttribute(
    'data-collapsed',
    'true',
  )
  // collapse key は親 Task A/E の design に従い Phase 5 着手時に実キー名を確定する
  const persisted = await anonymousPage.evaluate(() =>
    window.localStorage.getItem('ubm.shell.sidebar-collapsed'),
  )
  expect(persisted).toBeTruthy()
})

// S6: viewer / mobile 375 — drawer auto-close on route navigation
test('drawer auto-closes after navigating via a drawer link', async ({ anonymousPage }) => {
  await anonymousPage.setViewportSize({ width: 375, height: 812 })
  await anonymousPage.goto('/')
  await waitShellReady(anonymousPage)
  await openDrawer(anonymousPage)
  await anonymousPage
    .locator('[data-testid="shell-drawer"]')
    .getByRole('link', { name: 'メンバー' })
    .click()
  await expect(anonymousPage.locator('[data-testid="shell-drawer"]')).not.toBeVisible()
})
```

> nav item 数（S3=13）・action ラベル（S2「プロフィール / 編集申請 / ログアウト」、S3「管理者ダッシュボード」）・
> collapse marker（`data-collapsed`）・localStorage key（`ubm.shell.sidebar-collapsed`）・drawer link ラベル（S6「メンバー」）は
> 親 design spec を正本とし、Phase 5 着手時に親実装の実値で確定する。乖離時は親 spec へ同一 wave 申し送り。

---

## 4. visual spec シグネチャ（V1〜V7）

viewport は project で注入されるため spec は viewport-agnostic。各 test は `test.skip(testInfo.project.name !== ...)` で
role × viewport の 7 点だけ有効化する。

```ts
// apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts
import { expect, test } from '../../fixtures/auth'
import { freezeAnimations, openDrawer, waitShellReady } from './_helpers'

const SHOT = { fullPage: true, maxDiffPixelRatio: 0.02 } as const

// V1: viewer / desktop
test('viewer home desktop visual', async ({ anonymousPage }, testInfo) => {
  test.skip(testInfo.project.name !== 'sidebar-shell-visual-desktop')
  await anonymousPage.goto('/')
  await waitShellReady(anonymousPage)
  await freezeAnimations(anonymousPage)
  await expect(anonymousPage).toHaveScreenshot('home-1280.png', SHOT)
})

// V2: member / desktop
test('member profile desktop visual', async ({ memberPage }, testInfo) => {
  test.skip(testInfo.project.name !== 'sidebar-shell-visual-desktop')
  await memberPage.goto('/profile')
  await waitShellReady(memberPage)
  await freezeAnimations(memberPage)
  await expect(memberPage).toHaveScreenshot('profile-1280.png', SHOT)
})

// V3: admin / desktop
test('admin desktop visual', async ({ adminPage }, testInfo) => {
  test.skip(testInfo.project.name !== 'sidebar-shell-visual-desktop')
  await adminPage.goto('/admin')
  await waitShellReady(adminPage)
  await freezeAnimations(adminPage)
  await expect(adminPage).toHaveScreenshot('admin-1280.png', SHOT)
})

// V4: viewer / tablet
test('viewer home tablet visual', async ({ anonymousPage }, testInfo) => {
  test.skip(testInfo.project.name !== 'sidebar-shell-visual-tablet')
  await anonymousPage.goto('/')
  await waitShellReady(anonymousPage)
  await freezeAnimations(anonymousPage)
  await expect(anonymousPage).toHaveScreenshot('home-768.png', SHOT)
})

// V5: admin / tablet
test('admin tablet visual', async ({ adminPage }, testInfo) => {
  test.skip(testInfo.project.name !== 'sidebar-shell-visual-tablet')
  await adminPage.goto('/admin')
  await waitShellReady(adminPage)
  await freezeAnimations(adminPage)
  await expect(adminPage).toHaveScreenshot('admin-768.png', SHOT)
})

// V6: viewer / mobile
test('viewer home mobile visual', async ({ anonymousPage }, testInfo) => {
  test.skip(testInfo.project.name !== 'sidebar-shell-visual-mobile')
  await anonymousPage.goto('/')
  await waitShellReady(anonymousPage)
  await freezeAnimations(anonymousPage)
  await expect(anonymousPage).toHaveScreenshot('home-375.png', SHOT)
})

// V7: admin / mobile（drawer open）
test('admin mobile drawer visual', async ({ adminPage }, testInfo) => {
  test.skip(testInfo.project.name !== 'sidebar-shell-visual-mobile')
  await adminPage.goto('/admin')
  await waitShellReady(adminPage)
  await openDrawer(adminPage)
  await freezeAnimations(adminPage)
  await expect(adminPage).toHaveScreenshot('admin-375-drawer.png', SHOT)
})
```

- 各 visual project は spec 全 7 test を読み込むが、`test.skip` により対象 viewport 以外は skip され、
  desktop=3 / tablet=2 / mobile=2、実 run 合計 **7 screenshot** になる。
- `toHaveScreenshot` 第1引数にパス区切り `/` を含めない（`home-` prefix 正規化 / 不変条件 #6）。

---

## 5. `playwright.config.ts` 改修差分

### 5.1 `projects` 配列に追加（3 visual project + smoke project）

```ts
// sidebar-shell visual: local（mockApi + auth fixture）で 3 viewport baseline を撮る。
// staging には依存せず、既定の local webServer（localhost:3000）+ mock API（127.0.0.1:8787）を使う。
{
  name: 'sidebar-shell-visual-desktop',
  testDir: './playwright/tests/sidebar-shell',
  testMatch: /sidebar-shell-visual\.spec\.ts$/,
  use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
  snapshotPathTemplate:
    '{testDir}/{testFileName}-snapshots/{arg}-sidebar-shell-visual-desktop-{platform}{ext}',
},
{
  name: 'sidebar-shell-visual-tablet',
  testDir: './playwright/tests/sidebar-shell',
  testMatch: /sidebar-shell-visual\.spec\.ts$/,
  use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
  snapshotPathTemplate:
    '{testDir}/{testFileName}-snapshots/{arg}-sidebar-shell-visual-tablet-{platform}{ext}',
},
{
  name: 'sidebar-shell-visual-mobile',
  testDir: './playwright/tests/sidebar-shell',
  testMatch: /sidebar-shell-visual\.spec\.ts$/,
  use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } },
  snapshotPathTemplate:
    '{testDir}/{testFileName}-snapshots/{arg}-sidebar-shell-visual-mobile-{platform}{ext}',
},
{
  name: 'sidebar-shell-smoke',
  testDir: './playwright/tests/sidebar-shell',
  testMatch: /sidebar-shell-smoke\.spec\.ts$/,
  use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
},
```

> Task E の `admin-staging-visual-*` は staging（`storageState` + `PLAYWRIGHT_SKIP_WEB_SERVER=1`）専用だが、
> Task F は local 完結（不変条件 #7）のため `baseURL` / `storageState` / `dependencies` を指定せず、
> 既定の local webServer と auth fixture（spec 内で `anonymousPage`/`memberPage`/`adminPage`）に委ねる。

### 5.2 既存 project の `testIgnore` に visual spec を追加

visual spec が local default project（`desktop-chromium` / `visual-chromium` 等）で誤って走らないよう、
各 `testIgnore` に `/sidebar-shell\/sidebar-shell-visual\.spec\.ts$/` を追加する。

```ts
// desktop-chromium / desktop-firefox / mobile-webkit の testIgnore へ追記
testIgnore: [
  /visual\/.*\.spec\.ts$/,
  /visual-staging\/.*\.spec\.ts$/,
  /visual-staging-authenticated\/.*\.(spec|ts)$/,
  /visual-full\/.*\.spec\.ts$/,
  /full-smoke\.spec\.ts$/,
  /sidebar-shell\/sidebar-shell-visual\.spec\.ts$/, // ← 追加
  ...fixtureGatedTestIgnore,
],
```

> `visual-chromium`（`testMatch: /visual\/.*\.spec\.ts$/`）は `tests/visual/` 配下のみ拾うため、
> `tests/sidebar-shell/` の visual は元々マッチしない。`desktop-chromium` / `desktop-firefox` /
> `mobile-webkit` の testIgnore へ visual spec を追加し、smoke spec のみ default project でも拾われ得る点は
> `sidebar-shell-smoke` 専用 project で明示 run するため実害なし（CI は project 指定で起動する）。

### 5.3 `isTask18RegressionGate` への混入回避（確認事項）

`playwright.config.ts` の `isTask18RegressionGate` は `argv` に `/visual/` を含むと発火し EVIDENCE_DIR を切り替える。
Task F の visual spec は `tests/sidebar-shell/`（`/visual/` を含まない）かつ project 名で起動するため、`isTask18RegressionGate` には**該当しない**。
EVIDENCE_DIR は default 分岐のまま（撮影は snapshotPathTemplate により spec 隣接の `-snapshots/` に置かれ、EVIDENCE_DIR には依存しない）。

---

## 6. CI integration（`.github/workflows/playwright-smoke.yml`）

### 6.1 `smoke (chromium)` job に sidebar-shell smoke step を追加

既存 `smoke` job（`Run 19-route smoke` の後）に以下 step を追加する。

```yaml
      - name: Run sidebar-shell smoke
        env:
          PLAYWRIGHT_EVIDENCE_TASK: ''
          PLAYWRIGHT_TASK18_SMOKE: ''
        run: |
          mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
            --project=sidebar-shell-smoke
```

### 6.2 `visual (sidebar-shell)` 新 matrix job

`visual` job（`needs: smoke`）と並列に新 job を追加する。local 完結のため staging URL 不要。

```yaml
  sidebar-shell-visual:
    name: visual (sidebar-shell ${{ matrix.viewport }})
    runs-on: ubuntu-latest
    needs: smoke
    if: github.event_name != 'schedule'
    timeout-minutes: 15
    strategy:
      fail-fast: false
      matrix:
        viewport: [desktop, tablet, mobile]
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - name: Install deps
        run: mise exec -- pnpm install --frozen-lockfile
      - name: Install Chromium
        run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
      - name: Run sidebar-shell visual baseline (${{ matrix.viewport }})
        run: |
          mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
            --project=sidebar-shell-visual-${{ matrix.viewport }} \
            ${{ inputs.staging_visual_update_snapshots && '--update-snapshots' || '' }}
      - name: Upload sidebar-shell visual baselines
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: sidebar-shell-visual-baselines-${{ matrix.viewport }}
          path: apps/web/playwright/tests/sidebar-shell/**/*-sidebar-shell-visual-${{ matrix.viewport }}-linux.png
          if-no-files-found: warn
      - name: Upload sidebar-shell visual diff artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: sidebar-shell-visual-diff-${{ matrix.viewport }}
          path: apps/web/playwright/evidence
          if-no-files-found: ignore
```

> 実 job 名 / step 構造は既存 `playwright-smoke.yml` に合わせて Phase 5 着手時に最終確定する。
> diff artifact path は default EVIDENCE_DIR の test-results を指す場合は実 EVIDENCE_DIR に合わせて補正する。

---

## 7. 入力 / 出力 / 副作用

- **入力**: auth fixture が起動する local mock API（`127.0.0.1:8787`）の固定 GET 応答（`/me`・`/me/profile`・`/public/stats`・`/public/members`・`/admin/dashboard` 等は既存 seed で充足）。local webServer は `localhost:3000`（既定）。
- **出力**: `*-sidebar-shell-visual-{viewport}-linux.png` baseline 7 ファイル + smoke 6 件の pass/fail。
- **副作用**: mutation 系 API は呼ばない（read-only GET の mock のみ / 不変条件 #8）。CI runner のローカル fs に snapshot を生成し、baseline 更新時のみ bot push（§8）。
- mockApi seed が shell 描画に必要な GET を network 上カバーしない場合は Phase 5 で seed 追加（mutation には触らない / Phase 3 リスク表）。

---

## 8. baseline 取得手順

1. **local dry-run（撮影分は commit しない）**:
   ```bash
   mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
     --project=sidebar-shell-visual-desktop --list
   ```
2. **親 Task A〜E 統合確認**: shell component が実装され、想定 `data-testid` が付与済み・`/`・`/profile`・`/admin` が local で描画されること（Phase 10 ゲート）。
3. **CI baseline 撮影**: `playwright-smoke.yml` の `sidebar-shell-visual` matrix を `workflow_dispatch`（`staging_visual_update_snapshots: true`）で起動し、Linux runner で `--update-snapshots` 撮影。
4. **bot push**: workflow が GITHUB_TOKEN で baseline `-linux.png` を branch に push。
5. **空コミット再トリガー（user-gated）**: bot push は `pull_request` 非発火 → ユーザー明示承認後にだけ
   ```bash
   git commit --allow-empty -m "chore(visual): retrigger after sidebar-shell baseline"
   git push
   ```
   を開発者トークンで実行し、最終 HEAD で全 check を再評価する。

---

## 9. ローカル実行・検証コマンド

```bash
# Node 24 で依存インストール
mise exec -- pnpm install

# spec 構造 list（smoke 6 + visual 3 project 展開）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/sidebar-shell --list

# smoke のみ run
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=sidebar-shell-smoke --reporter=line

# visual の構造確認（実撮影は commit しない）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=sidebar-shell-visual-desktop --list

# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```
