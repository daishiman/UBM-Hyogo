import { expect, type Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class MemberDetailPage extends BasePage {
  url = '/members/m-1'
  readonly profileHeading = this.page.getByRole('heading', { level: 1 })
  readonly tagChips = this.page.locator('[data-testid="tag-chip"]')
  readonly breadcrumb = this.page.locator('[data-testid="breadcrumb"]')

  constructor(page: Page) {
    super(page)
  }

  async visit(id = 'm-1'): Promise<void> {
    this.url = `/members/${id}`
    await this.page.goto(this.url)
  }

  async assertHeading(): Promise<void> {
    await expect(this.profileHeading).toBeVisible()
  }
}
