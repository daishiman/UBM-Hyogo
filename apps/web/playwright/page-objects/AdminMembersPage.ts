import { BasePage } from './BasePage'

export class AdminMembersPage extends BasePage {
  readonly url = '/admin/members'
  readonly membersTable = this.page.locator('[data-testid="admin-members-table"]')
  readonly sortHeader = this.page.locator('[data-testid="admin-members-sort-header"]')

  async sortBy(column: string): Promise<void> {
    await this.sortHeader.locator(`[data-column="${column}"]`).click()
  }
}
