import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminSchemaPage extends BasePage {
  readonly url = '/admin/schema'
  readonly root = this.page.locator('[data-page="admin-schema"]')
  readonly diffPanel = this.page.locator('[aria-labelledby="schema-diff-h"]')
  readonly revisionAliasHistory = this.page.locator('[data-region="schema-revision-alias-history"]')

  async assertPrototypeAlignedShell(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'スキーマ差分のレビュー' })).toBeVisible()
    await expect(this.page.getByText('CURRENT REVISION')).toBeVisible()
    await expect(this.diffPanel).toBeVisible()
    await expect(this.revisionAliasHistory).toBeVisible()
  }
}
