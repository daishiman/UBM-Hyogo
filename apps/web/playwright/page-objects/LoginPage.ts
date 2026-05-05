import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export type AuthGateState =
  | 'input'
  | 'sent'
  | 'unregistered'
  | 'rules_declined'
  | 'deleted'

export class LoginPage extends BasePage {
  readonly url = '/login'
  readonly emailInput = this.page.locator('input[type="email"]')
  readonly submitButton = this.page.getByRole('button', { name: /送信|sign in|magic link/i })
  readonly stateBlock = this.page.locator('[data-testid="auth-gate-state"]')

  async gotoState(state: AuthGateState): Promise<void> {
    // 不変条件 #9: state は URL hash で切替（/no-access route は不在）
    await this.page.goto(`${this.url}#state=${state}`)
  }

  async assertNoAccessAbsent(): Promise<void> {
    // 不変条件 #9: /no-access route は存在しない（404）
    const response = await this.page.goto('/no-access', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(404)
  }
}
