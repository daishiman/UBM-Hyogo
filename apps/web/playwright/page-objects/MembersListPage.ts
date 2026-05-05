import { BasePage } from './BasePage'

export type MembersQuery = {
  q?: string
  zone?: string
  status?: string
  tag?: string
  sort?: string
  density?: 'comfy' | 'dense' | 'list'
}

export class MembersListPage extends BasePage {
  readonly url = '/members'
  readonly searchInput = this.page.locator('[data-testid="members-search-input"]')
  readonly memberCards = this.page.locator('[data-testid="member-card"]')
  readonly densityToggle = this.page.locator('[data-testid="density-toggle"]')
  readonly grid = this.page.locator('[data-testid="members-grid"]')

  async applyQuery(params: MembersQuery): Promise<void> {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && search.set(k, String(v)))
    await this.page.goto(`${this.url}?${search.toString()}`)
  }

  async clickFirstCard(): Promise<void> {
    await this.memberCards.first().click()
  }
}
