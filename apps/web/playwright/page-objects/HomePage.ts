import { BasePage } from './BasePage'

export class HomePage extends BasePage {
  readonly url = '/'
  readonly heroCta = this.page.locator('[data-testid="hero-cta"]')
  readonly membersLink = this.page.getByRole('link', { name: /members/i })
  readonly mobileMenuToggle = this.page.locator('[data-testid="mobile-menu-toggle"]')

  async openMobileMenu(): Promise<void> {
    await this.mobileMenuToggle.click()
  }
}
