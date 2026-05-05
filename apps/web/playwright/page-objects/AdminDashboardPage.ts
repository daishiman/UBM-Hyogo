import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminDashboardPage extends BasePage {
  readonly url = '/admin'
  readonly dashboardCards = this.page.locator('[data-testid="admin-dashboard-card"]')
  readonly sidebar = this.page.locator('[data-testid="admin-sidebar"]')

  async assertCards(): Promise<void> {
    await expect(this.dashboardCards.first()).toBeVisible()
  }
}
