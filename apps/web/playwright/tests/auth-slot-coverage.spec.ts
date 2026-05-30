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

const HEADER_LOCATOR =
  '[data-component="public-header"], [data-testid="member-header"], [data-route-group="admin"]'
const SESSION_COOKIE_NAME = 'authjs.session-token'
const E2E_AUTH_SECRET = process.env.AUTH_SECRET ?? 'playwright-e2e-auth-secret-32-bytes'

async function assertRender(page: Page, expected: State) {
  const header = page.locator(HEADER_LOCATOR).first()
  await expect(header).toHaveAttribute('data-auth-state', expected)
  if (expected === 'guest') {
    await expect(page.locator('[data-role="auth-cta"]').first()).toBeVisible()
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
      test(`${state} viewing ${route.path}`, async ({ page, mockApi }) => {
        await mockApi.reset()
        await page.goto(route.path, { waitUntil: 'domcontentloaded' })
        if (expected === 'redirect') {
          expect(page.url()).toMatch(/\/login(\?|$)/)
          return
        }
        await assertRender(page, expected)
        if (state === 'admin' && route.path === '/admin') {
          await expect(page.locator('[data-role="public-return"]').first()).toBeVisible()
        }
      })
    }
  })
}

test.describe('auth-slot regression', () => {
  test.use({ storageState: 'playwright/.auth/guest.json' })

  test('header data-auth-state literal is one of guest/member/admin', async ({ page, mockApi }) => {
    await mockApi.reset()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const value = await page.locator(HEADER_LOCATOR).first().getAttribute('data-auth-state')
    expect(value).toMatch(/^(guest|member|admin)$/)
  })

  test('public-return does not exist on public guest route', async ({ page, mockApi }) => {
    await mockApi.reset()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('[data-role="public-return"]')).toHaveCount(0)
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
