# Phase 5 — 実装手順

## 1. 変更ファイル一覧

| # | パス | 種別 | 内容 |
|---|------|------|------|
| 1 | `apps/web/playwright/tests/setup-auth.spec.ts` | 新規 | guest / member / admin storageState 生成 |
| 2 | `apps/web/playwright/tests/auth-slot-coverage.spec.ts` | 新規 | 21 ケース本体 + fail/regression 4 TC |
| 3 | `apps/web/playwright/.auth/.gitkeep` | 新規 | ディレクトリ存在保証 |
| 4 | `apps/web/playwright/.auth/.gitignore` | 新規 | runtime storageState JSON を ignore |
| 5 | `apps/web/playwright.config.ts` | 編集 | projects に `setup-auth` / `auth-slot-coverage` 追加 + 既存 projects に `testIgnore` 追加 |
| 6 | `.github/workflows/playwright-smoke.yml` | 編集 | `auth-slot` job 追加 |

## 2. setup-auth.spec.ts 実装

```ts
// apps/web/playwright/tests/setup-auth.spec.ts
import { test as setup } from '@playwright/test'
import { adminLogin, memberLogin } from '../fixtures/auth'

setup('guest storageState', async ({ context }) => {
  await context.clearCookies()
  await context.storageState({ path: 'playwright/.auth/guest.json' })
})

setup('member storageState', async ({ context, baseURL }) => {
  await memberLogin(context)
  await context.storageState({ path: 'playwright/.auth/member.json' })
})

setup('admin storageState', async ({ context, baseURL }) => {
  await adminLogin(context)
  await context.storageState({ path: 'playwright/.auth/admin.json' })
})
```

## 3. auth-slot-coverage.spec.ts 実装（関数シグネチャ）

```ts
// apps/web/playwright/tests/auth-slot-coverage.spec.ts
import { test, expect, type Page } from '@playwright/test'

type State = 'guest' | 'member' | 'admin'
type Expectation = State | 'redirect'

interface Route {
  readonly path: string
  readonly expect: Readonly<Record<State, Expectation>>
}

const ROUTES: readonly Route[] = [
  { path: '/',          expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/members',   expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/register',  expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/privacy',   expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/terms',     expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/profile',   expect: { guest: 'redirect', member: 'member', admin: 'admin' } },
  { path: '/admin',     expect: { guest: 'redirect', member: 'redirect', admin: 'admin' } },
] as const

const HEADER_LOCATOR =
  '[data-component="public-header"], [data-testid="member-header"], [data-route-group="admin"]'

async function assertRender(page: Page, expected: State) {
  const header = page.locator(HEADER_LOCATOR).first()
  await expect(header).toHaveAttribute('data-auth-state', expected)
  if (expected === 'guest') {
    await expect(page.locator('[data-role="auth-cta"]')).toBeVisible()
    await expect(page.locator('[data-role="member-cta"]')).toHaveCount(0)
    await expect(page.locator('[data-role="admin-cta"]')).toHaveCount(0)
  } else if (expected === 'member') {
    await expect(
      page.locator('[data-role="member-cta"], a[href="/profile"]').first(),
    ).toBeVisible()
    await expect(page.locator('[data-role="admin-cta"]')).toHaveCount(0)
  } else {
    await expect(
      page.locator('[data-role="member-cta"], a[href="/profile"]').first(),
    ).toBeVisible()
    await expect(
      page.locator('[data-role="admin-cta"], a[href="/admin"]').first(),
    ).toBeVisible()
  }
}

for (const state of ['guest', 'member', 'admin'] as const) {
  test.describe(`auth-slot @${state}`, () => {
    test.use({ storageState: `playwright/.auth/${state}.json` })

    for (const route of ROUTES) {
      const expected = route.expect[state]
      test(`${state} viewing ${route.path}`, async ({ page }) => {
        await page.goto(route.path, { waitUntil: 'domcontentloaded' })
        if (expected === 'redirect') {
          expect(page.url()).toMatch(/\/login(\?|$)/)
          return
        }
        await assertRender(page, expected)
        if (state === 'admin' && route.path === '/admin') {
          await expect(page.locator('[data-role="public-return"]')).toBeVisible()
        }
      })
    }
  })
}
```

## 4. playwright.config.ts 編集箇所

### 4.1 projects 配列に追加

```ts
{
  name: 'setup-auth',
  testMatch: /setup-auth\.spec\.ts$/,
},
{
  name: 'auth-slot-coverage',
  testMatch: /auth-slot-coverage\.spec\.ts$/,
  dependencies: ['setup-auth'],
  use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
},
```

### 4.2 既存 projects の `testIgnore` に追加

`desktop-chromium` / `desktop-firefox` / `mobile-webkit` / `staging` の `testIgnore` 配列に以下を追加：

```ts
/setup-auth\.spec\.ts$/,
/auth-slot-coverage\.spec\.ts$/,
```

## 5. .auth ignore 編集

`apps/web/playwright/.auth/.gitignore` を配置:

```
# playwright auth storageState (runtime generated)
*.json
!.gitignore
!.gitkeep
```

## 6. CI matrix 編集（.github/workflows/playwright-smoke.yml）

`visual` job の直後に以下 job を追加:

```yaml
  auth-slot:
    name: auth-slot (chromium, 25 cases)
    runs-on: ubuntu-latest
    needs: smoke
    if: github.event_name != 'schedule'
    timeout-minutes: 15
    env:
      AUTH_SECRET: playwright-e2e-auth-secret-32-bytes
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - name: Install deps
        run: mise exec -- pnpm install --frozen-lockfile
      - name: Install Chromium
        run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
      - name: Preflight (both-or-none storageState targets)
        run: |
          test -d apps/web/playwright || (echo "playwright dir missing" >&2; exit 1)
      - name: Run setup-auth + auth-slot-coverage
        run: |
          mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
            --project=setup-auth --project=auth-slot-coverage
      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: auth-slot-report
          path: apps/web/playwright-report
          if-no-files-found: ignore
```

## 7. 実行コマンド（ローカル）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# storageState 生成 → 21 ケース
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=setup-auth --project=auth-slot-coverage
```

## 8. DoD（実装層）

- [ ] `setup-auth` project が guest / member / admin の 3 JSON を生成する
- [ ] `auth-slot-coverage` project が 25 ケースすべて pass する
- [ ] guest が `/profile` / `/admin` で `/login` redirect
- [ ] member が `/admin` で `/login` redirect
- [ ] admin が `/admin` で `data-role="public-return"` 可視
- [ ] 既存 `desktop-chromium` / `visual-chromium` が regression なし（test --list で重複 0）
- [ ] CI `auth-slot` job が `needs: smoke` で並走可能
- [ ] `playwright/.auth/*.json` が `git status` に出現しない
- [ ] `pnpm typecheck` / `pnpm lint` green

## 9. CONST_005 完備

| 項目 | 状態 |
|------|------|
| 変更ファイル一覧 | §1 |
| 関数シグネチャ | §3 |
| テスト方針 | §3 末尾、Phase 4 参照 |
| 実行コマンド | §7 |
| DoD | §8 |
