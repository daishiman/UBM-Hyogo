import { BasePage } from './BasePage'

export class AdminTagsPage extends BasePage {
  readonly url = '/admin/tags'
  readonly tagList = this.page.locator('[data-testid="admin-tag-list"]')
  readonly addTagButton = this.page.locator('[data-testid="admin-add-tag-button"]')

  async clickAddTag(): Promise<void> {
    await this.addTagButton.click()
  }
}
