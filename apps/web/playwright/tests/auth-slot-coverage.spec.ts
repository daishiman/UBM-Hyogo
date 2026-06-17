import type { Page } from '@playwright/test'
import { signSessionJwt, type MemberId } from '@ubm-hyogo/shared'
import { memberLogin, test, expect } from '../fixtures/auth'

type State = 'guest' | 'member' | 'admin'
// 公開層は全ルート認証必須化（require-auth-public-access-gate）。未認証(guest)で公開ルートへ
// アクセスすると shell ではなく LoginRequiredNotice が描画される状態を 'gated' で表す。
type Expectation = State | 'redirect' | 'gated'

interface Route {
  readonly path: string
  readonly expect: Readonly<Record<State, Expectation>>
}

const ROUTES: readonly Route[] = [
  { path: '/', expect: { guest: 'gated', member: 'member', admin: 'admin' } },
  { path: '/members', expect: { guest: 'gated', member: 'member', admin: 'admin' } },
  { path: '/register', expect: { guest: 'gated', member: 'member', admin: 'admin' } },
  { path: '/privacy', expect: { guest: 'gated', member: 'member', admin: 'admin' } },
  { path: '/terms', expect: { guest: 'gated', member: 'member', admin: 'admin' } },
  { path: '/profile', expect: { guest: 'redirect', member: 'member', admin: 'admin' } },
  { path: '/admin', expect: { guest: 'redirect', member: 'redirect', admin: 'admin' } },
] as const

// task-c: 公開/会員は SidebarShell（[data-shell-root] が data-auth-state を保持）、管理は
// 専用 admin layout（[data-route-group="admin"]）。旧 PublicHeader/MemberHeader は撤去済。
const HEADER_LOCATOR = '[data-shell-root="true"], [data-route-group="admin"]'
const SESSION_COOKIE_NAME = 'authjs.session-token'
const E2E_AUTH_SECRET = process.env.AUTH_SECRET ?? 'playwright-e2e-auth-secret-32-bytes'

// SidebarShell は nav / user-menu を desktop aside と mobile drawer の両方へ二重 render する。
// よって CTA リンクは viewport / popover 開閉に依らず DOM に attached（hidden のことはある）。
// 旧 PublicHeader 由来の [data-role="*-cta"] と、shell の href / [data-action] の両方を許容する。
const AUTH_CTA = '[data-role="auth-cta"], [data-action="login"], a[href="/login"]'
const MEMBER_CTA = '[data-role="member-cta"], a[href="/profile"]'
const ADMIN_CTA = '[data-role="admin-cta"], a[href="/admin"]'

async function assertRender(page: Page, expected: State) {
  const header = page.locator(HEADER_LOCATOR).first()
  await expect(header).toHaveAttribute('data-auth-state', expected)
  if (expected === 'guest') {
    await expect(page.locator(AUTH_CTA).first()).toBeAttached()
    await expect(page.locator(MEMBER_CTA)).toHaveCount(0)
    await expect(page.locator(ADMIN_CTA)).toHaveCount(0)
  } else if (expected === 'member') {
    await expect(page.locator(MEMBER_CTA).first()).toBeAttached()
    await expect(page.locator(ADMIN_CTA)).toHaveCount(0)
  } else {
    await expect(page.locator(MEMBER_CTA).first()).toBeAttached()
    await expect(page.locator(ADMIN_CTA).first()).toBeAttached()
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
        if (expected === 'gated') {
          // 未認証は in-place で LoginRequiredNotice（リダイレクトはしない）。shell は描画されない。
          await expect(page.locator('[data-testid="login-required-notice"]')).toBeVisible()
          await expect(page.locator('[data-shell-root="true"]')).toHaveCount(0)
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

  test('header data-auth-state literal is one of guest/member/admin', async ({ page, context, mockApi }) => {
    await mockApi.reset()
    // 認証必須化により shell（data-auth-state 保持）は認証済みでのみ描画される。
    await memberLogin(context)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const value = await page.locator(HEADER_LOCATOR).first().getAttribute('data-auth-state')
    expect(value).toMatch(/^(guest|member|admin)$/)
  })

  test('public guest route is gated to LoginRequiredNotice (no public-return)', async ({ page, mockApi }) => {
    await mockApi.reset()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('[data-testid="login-required-notice"]')).toBeVisible()
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
