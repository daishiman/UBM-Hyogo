// TODO(08b): 実装は Phase 11 manual smoke で活性化
import { test } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'

const STATES = ['input', 'sent', 'unregistered', 'rules_declined', 'deleted'] as const

test.describe.skip('auth gate state (5 状態 + /no-access 不在)', () => {
  for (const state of STATES) {
    test(`desktop: /login state=${state}`, async ({ page }) => {
      const login = new LoginPage(page)
      await login.gotoState(state)
      await login.screenshot(`login-${state}`, 'desktop')
    })
    test(`mobile: /login state=${state}`, async ({ page }) => {
      const login = new LoginPage(page)
      await login.gotoState(state)
      await login.screenshot(`login-${state}`, 'mobile')
    })
  }

  // 不変条件 #9
  test('/no-access route が存在しない（404）', async ({ page }) => {
    const login = new LoginPage(page)
    await login.assertNoAccessAbsent()
  })
})
