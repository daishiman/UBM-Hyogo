// TODO(08b): 実装は Phase 11 manual smoke で活性化
import { test as base, expect, type Page, type BrowserContext } from '@playwright/test'

type AuthFixtures = {
  adminPage: Page
  memberPage: Page
  anonymousPage: Page
  adminContext: BrowserContext
  memberContext: BrowserContext
}

const SESSION_COOKIE_NAME = '__Secure-authjs.session-token'

// TODO: Auth.js 互換 JWT 生成。AUTH_SECRET は process.env から。
function signSession(_payload: { adminUserId?: string; memberId?: string }): string {
  return 'TODO_SIGNED_SESSION_PLACEHOLDER'
}

export const test = base.extend<AuthFixtures>({
  adminContext: async ({ browser, baseURL }, use) => {
    const ctx = await browser.newContext()
    await ctx.addCookies([
      {
        name: SESSION_COOKIE_NAME,
        value: signSession({ adminUserId: 'admin-1' }),
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
        value: signSession({ memberId: 'm-1' }),
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
