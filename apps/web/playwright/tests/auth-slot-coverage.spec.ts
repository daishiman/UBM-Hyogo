import type { Page } from '@playwright/test'
import { signSessionJwt, type MemberId } from '@ubm-hyogo/shared'
import { test, expect } from '../fixtures/auth'

type State = 'guest' | 'member' | 'admin'
type Expectation = State | 'redirect'

interface Route {
  readonly path: string
  readonly expect: Readonly<Record<State, Expectation>>
}

const ROUTES: readonly Route[] = [
  { path: '/', expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/members', expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/register', expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/privacy', expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/terms', expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/profile', expect: { guest: 'redirect', member: 'member', admin: 'admin' } },
  { path: '/admin', expect: { guest: 'redirect', member: 'redirect', admin: 'admin' } },
] as const

// unified-sidebar-shell 統合後の auth-state 契約:
// - 旧 PublicHeader / MemberHeader / admin route-group の data-auth-state は廃止。
// - 共通 SidebarShell の `[data-shell="app-shell"]` が `data-role="viewer|member|admin"` で auth-state を露出する。
// - role 別 CTA は左下 SidebarUserMenu の action（viewer=login / member=profile / admin=profile+admin-dashboard）。
//   desktop（>=md）では persistent `[data-shell="sidebar"]` 内に 1 度だけ描画される（mobile drawer は閉時 return null）。
const SHELL_LOCATOR = '[data-shell="app-shell"]'
const ROLE_FOR_STATE: Readonly<Record<State, 'viewer' | 'member' | 'admin'>> = {
  guest: 'viewer',
  member: 'member',
  admin: 'admin',
}
const SESSION_COOKIE_NAME = 'authjs.session-token'
const E2E_AUTH_SECRET = process.env.AUTH_SECRET ?? 'playwright-e2e-auth-secret-32-bytes'

async function assertRender(page: Page, expected: State) {
  const shell = page.locator(SHELL_LOCATOR).first()
  await expect(shell).toHaveAttribute('data-role', ROLE_FOR_STATE[expected])
  const sidebar = page.locator('[data-shell="sidebar"]').first()
  if (expected === 'guest') {
    // viewer: ログインリンクを直接描画（popover なし）。
    await expect(sidebar.locator('[data-action-id="login"]').first()).toBeVisible()
    await expect(page.locator('[data-action-id="profile"]')).toHaveCount(0)
    await expect(page.locator('[data-action-id="admin-dashboard"]')).toHaveCount(0)
  } else if (expected === 'member') {
    // member/admin: action は <details> popover 内のため存在（attached）を契約とする。
    await expect(sidebar.locator('[data-action-id="profile"]')).toHaveCount(1)
    await expect(page.locator('[data-action-id="admin-dashboard"]')).toHaveCount(0)
    await expect(page.locator('[data-action-id="login"]')).toHaveCount(0)
  } else {
    await expect(sidebar.locator('[data-action-id="profile"]')).toHaveCount(1)
    await expect(sidebar.locator('[data-action-id="admin-dashboard"]')).toHaveCount(1)
    await expect(page.locator('[data-action-id="login"]')).toHaveCount(0)
  }
}

for (const state of ['guest', 'member', 'admin'] as const) {
  test.describe(`auth-slot @${state}`, () => {
    test.use({ storageState: `playwright/.auth/${state}.json` })

    for (const route of ROUTES) {
      const expected = route.expect[state]
      test(`${state} viewing ${route.path}`, async ({ page, mockApi }) => {
        await mockApi.reset()
        await page.goto(route.path, { waitUntil: 'domcontentloaded' })
        if (expected === 'redirect') {
          expect(page.url()).toMatch(/\/login(\?|$)/)
          return
        }
        await assertRender(page, expected)
        if (state === 'admin' && route.path === '/admin') {
          // 公開サイト復帰導線は shell の「ホーム」nav / brand（href="/"）が担う。
          await expect(
            page.locator('[data-shell="sidebar"]').first().locator('a[href="/"]').first(),
          ).toBeVisible()
        }
      })
    }
  })
}

test.describe('auth-slot regression', () => {
  test.use({ storageState: 'playwright/.auth/guest.json' })

  test('shell data-role literal is one of viewer/member/admin', async ({ page, mockApi }) => {
    await mockApi.reset()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const value = await page.locator(SHELL_LOCATOR).first().getAttribute('data-role')
    expect(value).toMatch(/^(viewer|member|admin)$/)
  })

  test('admin-only nav action does not exist on public guest route', async ({ page, mockApi }) => {
    await mockApi.reset()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // guest（viewer）shell には admin-dashboard / profile action は出ない。
    await expect(page.locator('[data-action-id="admin-dashboard"]')).toHaveCount(0)
    await expect(page.locator('[data-action-id="profile"]')).toHaveCount(0)
  })

  test('invalid session cookie redirects from profile', async ({ page, context, mockApi }) => {
    await mockApi.reset()
    await context.addCookies([
      { name: SESSION_COOKIE_NAME, value: 'invalid-session', url: 'http://localhost:3000' },
    ])
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toMatch(/\/login(\?|$)/)
  })

  test('expired session cookie redirects from profile', async ({ page, context, mockApi }) => {
    await mockApi.reset()
    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = await signSessionJwt(E2E_AUTH_SECRET, {
      memberId: 'expired-member' as MemberId,
      email: 'expired-member@example.test',
      isAdmin: false,
      nowSeconds: nowSeconds - 3600,
      ttlSeconds: 1,
    })
    await context.addCookies([
      { name: SESSION_COOKIE_NAME, value: token, url: 'http://localhost:3000' },
    ])
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toMatch(/\/login(\?|$)/)
  })
})
