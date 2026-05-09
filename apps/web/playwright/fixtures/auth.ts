import { test as base, expect, type Page, type BrowserContext } from '@playwright/test'
import { signSessionJwt } from '@ubm-hyogo/shared'

type AuthFixtures = {
  adminPage: Page
  memberPage: Page
  anonymousPage: Page
  adminContext: BrowserContext
  memberContext: BrowserContext
}

const SESSION_COOKIE_NAME = 'authjs.session-token'
const TEST_AUTH_SECRET =
  process.env.AUTH_SECRET ?? 'playwright-auth-secret-playwright-auth-secret'

async function signSession(payload: { adminUserId?: string; memberId?: string }): Promise<string> {
  const isAdmin = Boolean(payload.adminUserId)
  const memberId = payload.memberId ?? (isAdmin ? 'admin-1' : 'member-1')
  return signSessionJwt(TEST_AUTH_SECRET, {
    memberId: memberId as never,
    email: isAdmin ? 'admin@example.com' : 'member@example.com',
    isAdmin,
    name: isAdmin ? 'Admin User' : 'Member User',
  })
}

export const test = base.extend<AuthFixtures>({
  adminContext: async ({ browser, baseURL }, use) => {
    const ctx = await browser.newContext()
    await ctx.addCookies([
      {
        name: SESSION_COOKIE_NAME,
        value: await signSession({ adminUserId: 'admin-1' }),
        url: baseURL ?? 'http://localhost:3000',
      },
    ])
    await use(ctx)
    await ctx.close()
  },
  memberContext: async ({ browser, baseURL }, use) => {
    const ctx = await browser.newContext()
    await ctx.addCookies([
      {
        name: SESSION_COOKIE_NAME,
        value: await signSession({ memberId: 'm-1' }),
        url: baseURL ?? 'http://localhost:3000',
      },
    ])
    await use(ctx)
    await ctx.close()
  },
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage()
    await use(page)
  },
  memberPage: async ({ memberContext }, use) => {
    const page = await memberContext.newPage()
    await use(page)
  },
  anonymousPage: async ({ browser }, use) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
})

export { expect }
