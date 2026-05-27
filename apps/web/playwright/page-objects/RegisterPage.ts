import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class RegisterPage extends BasePage {
  readonly url = '/register'
  readonly viewformLink = this.page.locator(
    'a[href*="docs.google.com/forms"][href*="viewform"]',
  )

  async assertExternalLink(): Promise<void> {
    await expect(this.viewformLink).toHaveAttribute('rel', /noopener/)
  }
}
