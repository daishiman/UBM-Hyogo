// login-page-prototype-alignment: /login prototype alignment smoke + Phase 11 screenshots.
// 不変条件 #8: URL query が gate state の正本。data-state 属性を locator として固定する。

import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const EVIDENCE_DIR = resolve(
  process.cwd(),
  '../../docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/screenshots',
)

const SCREENSHOT_BY_STATE = {
  input: 'login-input.png',
  sent: 'login-sent.png',
  unregistered: 'login-unregistered.png',
  rules_declined: 'login-rules-declined.png',
  deleted: 'login-deleted.png',
  error: 'login-error.png',
} as const

const STATES = [
  'input',
  'sent',
  'unregistered',
  'rules_declined',
  'deleted',
  'error',
] as const

async function hideDevOverlay(page: Page) {
  // WebKit は Report-Only CSP の style-src でも addStyleTag を reject するため try/catch で許容する。
  // 注入は dev overlay 抑制目的の cosmetic で機能アサーションには影響しない。
  try {
    await page.addStyleTag({
      content: `
        nextjs-portal,
        [data-nextjs-dev-tools-button],
        [data-nextjs-toast],
        [data-nextjs-dialog-overlay],
        [data-nextjs-dialog],
        [data-nextjs-build-error],
        [data-nextjs-terminal] {
          display: none !important;
          visibility: hidden !important;
        }
      `,
    })
  } catch {
    // CSP 拒否時は overlay 抑制をスキップし screenshot をそのまま継続
  }
}

test.describe('login-page-prototype-alignment /login state machine smoke', () => {
  test.setTimeout(180_000)

  test.beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
  })

  for (const state of STATES) {
    test(`/login?state=${state} renders LoginCard with data-state=${state}`, async ({
      page,
    }) => {
      const url =
        state === 'error'
          ? `/login?state=${state}&error=${encodeURIComponent('送信失敗')}`
          : state === 'sent'
            ? `/login?state=${state}&email=${encodeURIComponent('test@example.com')}`
          : `/login?state=${state}`
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      const card = page.getByTestId('login-card')
      await expect(card).toBeVisible()
      await expect(card).toHaveAttribute('data-state', state)
      await expect(card).toHaveAttribute('data-component', 'login-card')
      await hideDevOverlay(page)
      await page.screenshot({
        path: resolve(EVIDENCE_DIR, SCREENSHOT_BY_STATE[state]),
        fullPage: true,
      })
    })
  }

  test('/login captures mobile input screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('login-card')).toBeVisible()
    await expect(page.locator('.brand-mark')).toHaveText('兵')
    await hideDevOverlay(page)
    await page.screenshot({
      path: resolve(EVIDENCE_DIR, 'login-input-mobile.png'),
      fullPage: true,
    })
  })

  test('/login?gate=admin_required is reflected as warn banner on input', async ({
    page,
  }) => {
    await page.goto('/login?state=input&gate=admin_required', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByText(/管理者権限が必要/)).toBeVisible()
    await hideDevOverlay(page)
    await page.screenshot({
      path: resolve(EVIDENCE_DIR, 'login-gate-admin.png'),
      fullPage: true,
    })
  })

  test('/login prototype alignment keeps Magic Link as primary action', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.auth-shell')).toBeVisible()
    await expect(page.locator('.auth-card')).toBeVisible()
    await expect(page.locator('.brand-mark')).toHaveText('兵')
    await expect(page.getByRole('heading', { name: '会員ログイン' })).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()

    const magicLink = page.getByRole('button', { name: 'マジックリンクを送る' })
    const google = page.getByRole('button', { name: 'Googleでログイン' })
    await expect(magicLink).toBeVisible()
    await expect(google).toBeVisible()
    await expect(page.locator('.auth-or-divider')).toContainText('OR')

    const order = await page.locator('section[data-panel="input"]').evaluate((el) => {
      const text = el.textContent ?? ''
      return {
        magicLink: text.indexOf('マジックリンクを送る'),
        or: text.indexOf('OR'),
        google: text.indexOf('Googleでログイン'),
      }
    })
    expect(order.magicLink).toBeLessThan(order.or)
    expect(order.or).toBeLessThan(order.google)
    await expect(page.getByRole('link', { name: 'メンバー登録' })).toHaveAttribute(
      'href',
      '/register',
    )
  })
})
