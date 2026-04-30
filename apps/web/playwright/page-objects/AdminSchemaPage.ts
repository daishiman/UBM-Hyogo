import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminSchemaPage extends BasePage {
  readonly url = '/admin/schema'
  readonly schemaSections = this.page.locator('[data-testid="admin-schema-section"]')

  async assertSectionCount(expected = 6): Promise<void> {
    await expect(this.schemaSections).toHaveCount(expected)
  }
}
