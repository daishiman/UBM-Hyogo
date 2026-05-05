import { BasePage } from './BasePage'

export class AdminTagsPage extends BasePage {
  readonly url = '/admin/tags'
  readonly queueList = this.page.locator('[data-testid="admin-tag-queue-list"]')
  readonly reviewPanel = this.page.locator('[data-testid="admin-tag-review-panel"]')
  readonly statusFilters = this.page.getByRole('group', { name: 'ステータス絞込' })

  async assertQueueShell(): Promise<void> {
    await this.queueList.waitFor()
    await this.reviewPanel.waitFor()
    await this.statusFilters.waitFor()
  }
}
