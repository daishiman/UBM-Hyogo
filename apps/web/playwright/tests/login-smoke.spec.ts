// task-13 Phase 9: /login 6 状態 + gate=admin_required の Playwright smoke。
// 不変条件 #8: URL query が gate state の正本。data-state 属性を locator として固定する。

import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const EVIDENCE_DIR = resolve(
  process.cwd(),
  '../../docs/30-workflows/task-13-login-rebuild/outputs/phase-11',
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

test.describe('task-13 /login state machine smoke', () => {
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
          : `/login?state=${state}`
      await page.goto(url)
      const card = page.getByTestId('login-card')
      await expect(card).toBeVisible()
      await expect(card).toHaveAttribute('data-state', state)
      await expect(card).toHaveAttribute('data-component', 'login-card')
      await page.screenshot({
        path: resolve(EVIDENCE_DIR, SCREENSHOT_BY_STATE[state]),
        fullPage: true,
      })
    })
  }

  test('/login?gate=admin_required is reflected as warn banner on input', async ({
    page,
  }) => {
    await page.goto('/login?state=input&gate=admin_required')
    await expect(page.getByText(/管理者権限が必要/)).toBeVisible()
    await page.screenshot({
      path: resolve(EVIDENCE_DIR, 'login-gate-admin.png'),
      fullPage: true,
    })
  })
})
